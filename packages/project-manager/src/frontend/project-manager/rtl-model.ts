import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileType, FileChangeType } from '@theia/filesystem/lib/common/files';
import { IRTLModel } from '../../common/rtl-model';
import { DesignFilesExcludeEvent, DesignTopModuleChangeEvent, ProjectManager, TestBenchesAddEvent, TestBenchesRemoveEvent } from './project-manager';

export const hdlExt: string[] = ['.v', '.vh', '.sv', '.svh'];
export const hdlExtWtHeaders: string[] = ['.v', '.sv'];

export const regexp =  [
    new RegExp('rtl'), 
    new RegExp('fpga'), 
    new RegExp('vlsi'), 
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

export interface HDLModuleRef {
    name: string,
    uri: URI
}

// Meta file

export interface TopModuleMetaDescription {
    name: string,
    relPath: string
}

export class RTLModel implements IRTLModel {

    projManager: ProjectManager;
    fileService: FileService;

    rtlModelName: string;

    rtlModelUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    vlsiUri: URI;
    otherUri: URI;
    configUri: URI;

    simResultsUri: URI;

    rtlModelDesctiptionUri: URI;
    veribleFilelistUri: URI;

    target: string = 'zybo';
    topLevelModule: HDLModuleRef | undefined = undefined;

    isFavorite: boolean = false;

    indexedHDLFiles: URI[] = [];

    designIncludedHDLFiles: URI[] = [];
    designExcludedHDLFiles: URI[] = [];

    hdlFilesDescription: HDLFileDescription[] = [];
    testbenchesFiles: HDLModuleRef[] = [];
    contrainsFiles: [URI[]] = [[]];
    
    constructor(projManager: ProjectManager, rtlModelRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        let a = rtlModelRoot.path.fsPath().split('/').pop();
        if(a) this.rtlModelName = a;

        this.rtlModelUri = rtlModelRoot.normalizePath();
        this.rtlUri = this.rtlModelUri.resolve('rtl');
        this.simResultsUri = this.rtlUri.resolve('simresults');
        this.fpgaUri = this.rtlModelUri.resolve('fpga');
        this.vlsiUri = this.rtlModelUri.resolve('vlsi');
        this.otherUri = this.rtlModelUri.resolve('other');
        this.configUri = this.rtlModelUri.resolve('.config');
        this.veribleFilelistUri = this.configUri.resolve('verible.filelist');
        this.rtlModelDesctiptionUri = this.configUri.resolve('rtlmodel_description.json');

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

        this.projManager.onDidChangeRTLModel(async (event) => {
            if(event.model == this && !(await this.fileService.exists(this.veribleFilelistUri))){
                this.updateVeribleMetaFile();
            }
        });

        this.projManager.onDidDesignFilesInclude((event: DesignFilesExcludeEvent) => {
            
            if(this.projManager.getCurrProject()?.getCurrRTLModel() == this){
                this.designExcludedHDLFiles = this.designExcludedHDLFiles.filter(e => event.uris.find(i => i.isEqual(e)) === undefined);
                this.designIncludedHDLFiles = this.designIncludedHDLFiles.concat(event.uris);
                this.updateVeribleMetaFile();
            }

        });

        this.projManager.onDidDesignFilesExclude((event: DesignFilesExcludeEvent) => {

            if(this.projManager.getCurrProject()?.getCurrRTLModel() == this){
                this.designIncludedHDLFiles = this.designIncludedHDLFiles.filter(e => event.uris.find(i => i.isEqual(e)) === undefined);
                this.projManager.removeTestBenchByUri(event.uris);
                this.designExcludedHDLFiles = this.designExcludedHDLFiles.concat(event.uris);
                this.checkTopLevelModuleRelevance();
                this.updateVeribleMetaFile();
            }

        });

        this.projManager.onDidChangeDesignTopModule((event: DesignTopModuleChangeEvent) => {
            if(this.projManager.getCurrProject()?.getCurrRTLModel() == this){
                this.topLevelModule = event.module;
                if(this.topLevelModule && this.testbenchesFiles.find(i => i.uri.isEqual(this.topLevelModule!.uri) === undefined)) {
                    this.projManager.addTestBenchByHDLModuleRef(this.topLevelModule);
                }
                event.complete();
            }
        });

        this.projManager.onDidAddTestBench((event: TestBenchesAddEvent) => {

            if(this.projManager.getCurrProject()?.getCurrRTLModel() == this){
                this.testbenchesFiles = this.testbenchesFiles.concat(event.module);
            }
            event.complete();

        });

        this.projManager.onDidRemoveTestBench((event: TestBenchesRemoveEvent) => {

            console.log('kek lol', event);

            if(this.projManager.getCurrProject()?.getCurrRTLModel() == this){
                this.testbenchesFiles = this.testbenchesFiles.filter(e => event.modules.find(i => i.uri.isEqual(e.uri)) === undefined);
            }
            event.complete();

        });
        

        this.indexHDLFiles();

    }

    private async indexHDLFiles(): Promise<void>{
        this.indexedHDLFiles = [];
        await this.processDir(this.rtlUri);
        if(await this.fileService.exists(this.rtlModelDesctiptionUri)){
            const data = JSON.parse((await this.fileService.read(this.rtlModelDesctiptionUri)).value);
            if(data.top_module){
                this.topLevelModule = {name: data.top_module.name, uri:this.rtlModelUri.resolve(data.top_module.relPath)} as HDLModuleRef;
                this.testbenchesFiles.push(this.topLevelModule);
            }
            this.designExcludedHDLFiles = data.design_exclude.map((e: string) => this.rtlModelUri.resolve(e));
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

    public collectDependencyHDLFilesFor(node: HDLModuleRef): URI[] {
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
                            relPath: this.rtlModelUri.relative(this.topLevelModule.uri)?.toString()
                            } as TopModuleMetaDescription 
                        : undefined,
            design_exclude: this.designExcludedHDLFiles.map(e => this.rtlModelUri.relative(e)?.toString())
       });
       this.fileService.write(this.rtlModelDesctiptionUri, string);
    }


    //Getters

    public getRootUri(): URI{ 
        return this.rtlModelUri;
    }
    
    public getRTLUri(): URI{
        return this.rtlUri;
    }

    public getFPGAUri(): URI{
        return this.fpgaUri;
    }

    public getVLSIUri(): URI{
        return this.vlsiUri;
    }

    public getOthertUri(): URI{
        return this.otherUri;
    }

    public async rtlFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.rtlUri);
    }

    public async simuResultsFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.simResultsUri);
    }
    
    public async fpgaFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.fpgaUri);
    }

    public async vlsiFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.vlsiUri);
    }

    public async otherFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.otherUri);
    }

    public getConfig(): Object {
        return {
            name: this.rtlModelName,
            root: this.rtlModelUri,
            rtlUri: this.rtlUri,
            fpgaUri: this.fpgaUri,
            vlsiUri: this.vlsiUri,
            otherUri: this.otherUri
        };
    }
}