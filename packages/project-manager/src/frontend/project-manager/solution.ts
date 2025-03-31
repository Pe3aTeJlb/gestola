import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileType, FileChangeType } from '@theia/filesystem/lib/common/files';
import { ISolution } from '../../common/solution';
import { DesignFilesExcludeEvent, DesignTopModuleChangeEvent, ProjectManager } from './project-manager';

export const hdlExt: string[] = ['.v', '.vh', '.sv', '.svh'];
export const hdlExtWtHeaders: string[] = ['.v', '.sv'];

export const regexp =  [
    new RegExp('rtl'), 
    new RegExp('fpga'), 
    new RegExp('topology'), 
    new RegExp('other'),
    new RegExp('.config')
];

export const comment: RegExp = /\/\*[\s\S\n]*?\*\/|\/\/.*$/gmi;

export const verilogModuleNaneRegexp: RegExp = /[A-Za-z_]{1}[A-Za-z0-9_$]*/gmi;

export const moduleDeclarationRegexp: RegExp = /(?<=\bmodule\s*)\b([A-Za-z_]{1}[A-Za-z0-9_$]*)\s*(#\s*\([^;]*\))*\s*(\([^;]*\))*;/gmi;
export const moduleNameFromDeclarationRegexp: RegExp = /[A-Za-z_]{1}[A-Za-z0-9_$]*(?=\s*#?\(|\s*;)/gmi;

export const instanceDeclarationRegexp: RegExp = /(?<!\bmodule\s*)\b([A-Za-z_]{1}[A-Za-z0-9_$]*)\s*(#\s*\([^;]*\))*\s*(?<!\bmodule\s*)\b[A-Za-z_]{1}[A-Za-z0-9_$]*\s*(\([^;]*\);){1}/gmi;
export const instanceClassNameRegexp: RegExp = /(?<!\.)\b[A-Za-z_]{1}[A-Za-z0-9_$]*(?=\s*\()/gmi;

export interface HDLFileDescription {
    uri: URI,
    module: ModuleDescription
}

export interface ModuleDescription {
    name: string,
    dependencies: string[] | undefined
}

export interface TopLevelModule {
    name: string,
    uri: URI
}

export interface SolutionDescription{
    name: string,
    relPath: string
}

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
    topLevelModule: TopLevelModule | undefined = undefined;

    isFavorite: boolean = false;

    indexedHDLFiles: URI[] = [];

    designIncludedHDLFiles: URI[] = [];
    designExcludedHDLFiles: URI[] = [];

    hdlFilesDescription: HDLFileDescription[] = [];                            
    
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

        this.fileService.onDidFilesChange((event) => event.changes.forEach(async i => {
            if(this.rtlUri.isEqualOrParent(i.resource)){
                if(hdlExt.includes(i.resource.path.ext)){

                    if(i.type == FileChangeType.ADDED){

                        if(this.indexedHDLFiles.find(e => e.isEqual(i.resource)) === undefined){
                            this.indexedHDLFiles.push(i.resource);
                            this.designIncludedHDLFiles.push(i.resource);
                            await this.processHDLFile(i.resource);
                        }

                    } else if (i.type == FileChangeType.UPDATED) {

                        if(this.indexedHDLFiles.find(e => e.isEqual(i.resource)) === undefined){

                            this.indexedHDLFiles.push(i.resource);
                            this.designIncludedHDLFiles.push(i.resource);
                            this.hdlFilesDescription = this.hdlFilesDescription.filter(e => !e.uri.isEqual(i.resource));
                            await this.processHDLFile(i.resource);

                        }

                    } else if (i.type == FileChangeType.DELETED){

                        this.indexedHDLFiles = this.indexedHDLFiles.filter(e => !e.isEqual(i.resource));

                        this.designIncludedHDLFiles = this.designIncludedHDLFiles.filter(e => !e.isEqual(i.resource));
                        this.designExcludedHDLFiles = this.designExcludedHDLFiles.filter(e => !e.isEqual(i.resource));

                        this.hdlFilesDescription    = this.hdlFilesDescription.filter(e => !e.uri.isEqual(i.resource));

                        this.checkTopLevelModuleRelevance();

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
                this.designExcludedHDLFiles = this.designExcludedHDLFiles.filter(e => event.uris.find(i => i.isEqual(e)) === undefined);
                this.designIncludedHDLFiles = this.designIncludedHDLFiles.concat(event.uris);
                this.updateVeribleMetaFile();
            }

        });

        this.projManager.onDidDesignFilesExclude((event: DesignFilesExcludeEvent) => {

            if(this.projManager.getCurrProject()?.getCurrSolution() == this){
                this.designIncludedHDLFiles = this.designIncludedHDLFiles.filter(e => event.uris.find(i => i.isEqual(e)) === undefined);
                this.designExcludedHDLFiles = this.designExcludedHDLFiles.concat(event.uris);
                this.checkTopLevelModuleRelevance();
                this.updateVeribleMetaFile();
            }

        });

        this.projManager.onDidChangeDesignTopModule((event: DesignTopModuleChangeEvent) => {
            this.topLevelModule = event.module;
            event.complete();
        });

        this.indexHDLFiles();

    }

    private async indexHDLFiles(): Promise<void>{
        this.indexedHDLFiles = [];
        await this.processDir(this.rtlUri);
        if(await this.fileService.exists(this.solutionDesctiptionUri)){
            const data = JSON.parse((await this.fileService.read(this.solutionDesctiptionUri)).value);
            if(data.top_module){
                this.topLevelModule = {name: data.top_module.name, uri:this.solutionUri.resolve(data.top_module.relPath)} as TopLevelModule;
            }
            this.designExcludedHDLFiles = data.design_exclude.map((e: string) => this.solutionUri.resolve(e));
        }
        this.designIncludedHDLFiles = this.indexedHDLFiles.filter(e => this.designExcludedHDLFiles.find(i => i.isEqual(e)) === undefined);

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

        let content = (await this.fileService.read(uri)).value.replace(comment, "");
        let modules = content.split(/endmodule/gmi);

        for(let i = 0; i < modules.length - 1; i++){

            let name = modules[i].match(moduleDeclarationRegexp)?.map(e => e.match(moduleNameFromDeclarationRegexp))[0] as any;
            let dependencies = modules[i].match(instanceDeclarationRegexp)?.map(e => e.match(verilogModuleNaneRegexp))[0]?.[0] as any;
            this.hdlFilesDescription.push({uri: uri, module: {name: name[0], dependencies: dependencies}});

        }

    }



    private checkTopLevelModuleRelevance(): void {

        if(this.topLevelModule?.uri
            || this.indexedHDLFiles.find(e => this.topLevelModule?.uri.isEqual(e)) === undefined
            || this.designIncludedHDLFiles.find(e => this.topLevelModule?.uri.isEqual(e)) === undefined){
            this.projManager.setTopModule(undefined);
        }

    }



    public collectDependencyHDLFiles(): URI[] {
        return this.collectModuleDependencyHDLFiles(this.hdlFilesDescription.find(e => this.topLevelModule?.uri.isEqual(e.uri) && e.module.name == this.topLevelModule.name));
    }

    public collectDependencyHDLFilesFor(node: TopLevelModule): URI[] {
        return this.collectModuleDependencyHDLFiles(this.hdlFilesDescription.find(e => node.uri.isEqual(e.uri) && e.module.name == node.name));
    }

    private collectModuleDependencyHDLFiles(node: HDLFileDescription | undefined): URI[] {

        if(node){

            let arr: URI[] = [];
            arr.push(node.uri);
        
            this.hdlFilesDescription.filter(e => node.module.dependencies?.includes(e.module.name))
            .filter(e => this.designIncludedHDLFiles.find(i => i.isEqual(e.uri)) !== undefined)
            .forEach(e => arr.push(...this.collectModuleDependencyHDLFiles(e)));

            return arr;
        } else {
            return [] as URI[];
        }
    

    }






    private async updateVeribleMetaFile(){
        this.fileService.write(this.veribleFilelistUri, this.designIncludedHDLFiles.map(e => e.path.fsPath()).join('\n'));
    }

    public async saveMetadata(){
       let string = JSON.stringify({
            top_module:  this.topLevelModule 
                        ? {
                            name: this.topLevelModule.name, 
                            relPath: this.solutionUri.relative(this.topLevelModule.uri)?.toString()
                            } as SolutionDescription 
                        : undefined,
            design_exclude: this.designExcludedHDLFiles.map(e => this.solutionUri.relative(e)?.toString())
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