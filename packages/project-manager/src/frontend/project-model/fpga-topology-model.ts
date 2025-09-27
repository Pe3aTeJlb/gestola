import { URI } from "@theia/core";
import { ProjectManager } from "../project-manager";
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileChangeType } from '@theia/filesystem/lib/common/files';

export const USED_IN_NONE = 0;
export const USED_IN_SYNTH_AND_IMPL = 1;
export const USED_IN_SYTH_ONLY = 2;
export const USED_IN_IMPL_ONLY = 3;

export class FPGATopologyModel {

    id = "";
    typeId = "FPGAModel";

    projManager: ProjectManager;
    fileService: FileService;

    name: string;

    rootUri: URI;
    contrainsUri: URI;
    synthResults: URI;
    implResults: URI;
    fpgaModelDesctiptionUri: URI;

    constrainsFiles: URI[];
    constrainsFilesUsageMap: Map<string, number> = new Map<string, number>();

    constructor(projManager: ProjectManager, fpgaModelRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.name = fpgaModelRoot.path.name;

        this.rootUri = fpgaModelRoot;
        this.contrainsUri = fpgaModelRoot.resolve('constrains');
        this.synthResults = fpgaModelRoot.resolve('synthresults');
        this.implResults = fpgaModelRoot.resolve('implresults');
        this.fpgaModelDesctiptionUri = fpgaModelRoot.resolve('fpgamodel_description.json');

        this.fileService.onDidFilesChange((event) => event.changes.forEach(async i => {
            if(this.contrainsUri.isEqualOrParent(i.resource)){

                if(i.type == FileChangeType.ADDED){

                    this.constrainsFiles.push(i.resource);
                    this.constrainsFilesUsageMap.set(i.resource.path.base, USED_IN_SYNTH_AND_IMPL);

                } else if (i.type == FileChangeType.UPDATED) {

                    if(this.constrainsFiles.find(e => e.isEqual(i.resource)) === undefined){

                        this.constrainsFiles.push(i.resource);
                        this.constrainsFilesUsageMap.set(i.resource.path.base, USED_IN_SYNTH_AND_IMPL);
                    }

                } else if (i.type == FileChangeType.DELETED){

                    this.constrainsFiles = this.constrainsFiles.filter(e => !e.isEqual(i.resource));
                    
                } 
                
            }
        }));

        this.process();

    }

    private async process() {

        if(await this.fileService.exists(this.contrainsUri) == false){
            this.fileService.createFolder(this.contrainsUri);
        }

        if(await this.fileService.exists(this.synthResults) == false){
            this.fileService.createFolder(this.synthResults);
        }

        if(await this.fileService.exists(this.implResults) == false){
            this.fileService.createFolder(this.implResults);
        }

        let stats = await this.fileService.resolve(this.contrainsUri);

        if(stats.children){
            this.constrainsFiles = stats.children?.map(i => i.resource);
        }

        if(await this.fileService.exists(this.fpgaModelDesctiptionUri)){
            const data = JSON.parse((await this.fileService.read(this.fpgaModelDesctiptionUri)).value);
            data.usage_types.forEach((e:any) => this.constrainsFilesUsageMap.set(e.uri, e.type));
        }

    }

    public async saveMetadata (){
        let entries = [];
        for(let entrie of this.constrainsFilesUsageMap.entries()){
            entries.push(
                {
                    type: entrie[1],
                    uri: entrie[0]
                }
            );
        }
        let string = JSON.stringify({
            usage_types: entries
       });
       this.fileService.write(this.fpgaModelDesctiptionUri, string);
    }

    public setConstainsFileUsageType(uri: URI, type: number){
        this.constrainsFilesUsageMap.set(uri.path.base, type);
    }

    public async constrainsFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.contrainsUri);
    }

    public async synthResultsFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.synthResults);
    }

    public async implResultsFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.implResults);
    }

}