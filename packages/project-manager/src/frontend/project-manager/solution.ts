import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileType, FileChangeType } from '@theia/filesystem/lib/common/files';
import { ISolution } from '../../common/solution';
import { DesignFilesExcludeEvent, DesignTopModuleChangeEvent, ProjectManager } from './project-manager';

export const hdlExt: string[] = ['.v', '.vh', '.sv', '.svh'];
export const hdlExtWtHeaders: string[] = ['.v', '.sv'];

export class Solution implements ISolution {

    projManager: ProjectManager;
    fileService: FileService;

    solutionName: string;

    solutionUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    topologyUri: URI;
    otherUri: URI;
    configUri: URI;

    solutionDesctiptionUri: URI;
    veribleFilelistUri: URI;

    target: string = 'zybo';
    topLevelModule: URI | undefined = undefined;

    isFavorite: boolean = false;

    indexedHDLFiles: URI[] = [];
    designHDLFiles: URI[] = [];
    excludedDesignHDLFiles: URI[] = [];
    topModuleHierarchyHDLFiles: URI[] = [];

    public static regexp =  [
                                new RegExp('rtl'), 
                                new RegExp('fpga'), 
                                new RegExp('topology'), 
                                new RegExp('other'),
                                new RegExp('.config')
                            ];

    public static moduleDeclarationRegexp: RegExp = /(?<=\bmodule\s*)\b([A-Za-z_]{1}[A-Za-z0-9_$]*)\s*(\([^;]*\))*;/gmi;
    public static moduleNameFromDeclarationRegexp: RegExp = /[A-Za-z_]{1}[A-Za-z0-9_$]*(?=\s*\(|;)/gmi;
    
    public static instanceDeclarationRegexp = new RegExp('(?<!module\s*)\b([A-Za-z_]{1}[A-Za-z0-9_$]*)\s*(#\s*\([^;]*\))*\s+\b[A-Za-z_]{1}[A-Za-z0-9_$]*\s*(\([^;]*\);){1}', 'gmi');
    public static instanceClassNameRegexp = /[A-Za-z_]{1}[A-Za-z0-9_$]*/gmi;
                            
    
    constructor(projManager: ProjectManager, solutionRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        let a = solutionRoot.path.fsPath().split('/').pop();
        if(a) this.solutionName = a;

        this.solutionUri = solutionRoot.normalizePath();
        this.rtlUri = this.solutionUri.resolve('rtl');
        this.fpgaUri = this.solutionUri.resolve('fpga');
        this.topologyUri = this.solutionUri.resolve('topology');
        this.otherUri = this.solutionUri.resolve('other');
        this.configUri = this.solutionUri.resolve('.config');
        this.veribleFilelistUri = this.configUri.resolve('verible.filelist');
        this.solutionDesctiptionUri = this.configUri.resolve('solution_description.json');

        this.fileService.onDidFilesChange((event) => event.changes.forEach(i => {
            if(this.rtlUri.isEqualOrParent(i.resource)){
                if(hdlExt.includes(i.resource.path.ext)){

                    if(i.type == FileChangeType.ADDED){
                        if(this.indexedHDLFiles.find(e => e.isEqual(i.resource)) === undefined){
                            this.indexedHDLFiles.push(i.resource);
                            this.designHDLFiles.push(i.resource);
                        }
                    } else if (i.type == FileChangeType.UPDATED) {
                        if(this.indexedHDLFiles.find(e => e.isEqual(i.resource)) === undefined){
                            this.indexedHDLFiles.push(i.resource);
                            this.designHDLFiles.push(i.resource);
                        }
                    } else if (i.type == FileChangeType.DELETED){
                        this.indexedHDLFiles = this.indexedHDLFiles.filter(e => !e.isEqual(i.resource));
                        this.designHDLFiles = this.designHDLFiles.filter(e => !e.isEqual(i.resource));
                        this.excludedDesignHDLFiles = this.excludedDesignHDLFiles.filter(e => !e.isEqual(i.resource));
                    } 
                    this.updateVeribleMetaFile();
                }
            }
        }));

        this.projManager.onDidChangeSolution(async (event) => {
            if(event.solution == this && !(await this.fileService.exists(this.veribleFilelistUri))){
                this.updateVeribleMetaFile();
            }
        });

        this.projManager.onDidDesignFilesInclude((event: DesignFilesExcludeEvent) => {
            
            if(this.projManager.getCurrProject()?.getCurrSolution() == this){
                this.excludedDesignHDLFiles = this.excludedDesignHDLFiles.filter(e => event.uris.find(i => i.isEqual(e)) === undefined);
                this.designHDLFiles = this.designHDLFiles.concat(event.uris);
                this.updateVeribleMetaFile();
            }

        });

        this.projManager.onDidDesignFilesExclude((event: DesignFilesExcludeEvent) => {

            if(this.projManager.getCurrProject()?.getCurrSolution() == this){
                this.designHDLFiles = this.designHDLFiles.filter(e => event.uris.find(i => i.isEqual(e)) === undefined);
                this.excludedDesignHDLFiles = this.excludedDesignHDLFiles.concat(event.uris);
                this.updateVeribleMetaFile();
            }

        });

        this.projManager.onDidChangeDesignTopModule((event: DesignTopModuleChangeEvent) => {
            this.topLevelModule = event.uri;
            this.buildModulesDependencyTree(this.topLevelModule);
        });


        this.indexHDLFiles();

    }

    private async indexHDLFiles(): Promise<void>{
        this.indexedHDLFiles = [];
        await this.processDir(this.rtlUri);
        if(await this.fileService.exists(this.solutionDesctiptionUri)){
            const data = JSON.parse((await this.fileService.read(this.solutionDesctiptionUri)).value);
            if(data.top_module)this.topLevelModule = this.solutionUri.resolve(data.top_module);
            this.excludedDesignHDLFiles = data.design_exclude.map((e: string) => this.solutionUri.resolve(e));
        }
        this.designHDLFiles = this.indexedHDLFiles.filter(e => this.excludedDesignHDLFiles.find(i => i.isEqual(e)) === undefined);

        await this.updateVeribleMetaFile();
    }

    private async processDir(baseUri: URI) {
        let contents = Array.from((await (await this.fileService.activateProvider(baseUri.scheme)).readdir(baseUri)).values());
        for(let content of contents){
            if(content[1] == FileType.File){
                let extIndex = content[0].lastIndexOf('.');
                let ext = extIndex === -1 ? '' : content[0].substring(extIndex);
                if(hdlExt.includes(ext)){
                    let uri = new URI(baseUri.path.join(content[0]).fsPath());
                    this.indexedHDLFiles.push(uri);
                    if(hdlExtWtHeaders.includes(ext)) await this.processHDLFile(uri);
                }
            } else if (content[1] == FileType.Directory){
                let uri = new URI(baseUri.path.join(content[0]).fsPath());
                await this.processDir(uri);
            }
        }
    }

    private async processHDLFile(uri: URI){

        console.log('lel 1', uri.path.fsPath());
        let content = (await this.fileService.read(uri)).value;
        let modules = content.match(Solution.moduleDeclarationRegexp)?.map(e => e.match(Solution.moduleNameFromDeclarationRegexp));
        console.log('modules', modules);


    }





    private async buildModulesDependencyTree(root: URI){

    }






    private async updateVeribleMetaFile(){
        this.fileService.write(this.veribleFilelistUri, this.designHDLFiles.map(e => e.path.fsPath()).join('\n'));
    }

    public async saveMetadata(){
       let string = JSON.stringify({
            top_module:  this.topLevelModule ? this.solutionUri.relative(this.topLevelModule)?.toString() : undefined,
            design_exclude: this.excludedDesignHDLFiles.map(e => this.solutionUri.relative(e)?.toString())
       });
       this.fileService.write(this.solutionDesctiptionUri, string);
    }


    //Getters

    public getRootUri(): URI{ 
        return this.solutionUri;
    }
    
    public getRTLUri(): URI{
        return this.rtlUri;
    }

    public getFPGAtUri(): URI{
        return this.fpgaUri;
    }

    public getTopologyUri(): URI{
        return this.topologyUri;
    }

    public getOthertUri(): URI{
        return this.otherUri;
    }

    public async rtlFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.rtlUri);
    }
    
    public async fpgaFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.fpgaUri);
    }

    public async topologyFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.topologyUri);
    }

    public async otherFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.otherUri);
    }

    public getConfig(): Object {
        return {
            name: this.solutionName,
            root: this.solutionUri,
            rtlUri: this.rtlUri,
            fpgaUri: this.fpgaUri,
            topologyUri: this.topologyUri,
            otherUri: this.otherUri
        };
    }
}