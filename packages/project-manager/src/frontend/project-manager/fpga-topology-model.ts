import { URI } from "@theia/core";
import { ProjectManager } from "./project-manager";
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';

export const USED_IN_NONE = 0;
export const USED_IN_SYNTH_AND_IMPL = 1;
export const USED_IN_SYTH_ONLY = 2;
export const USED_IN_IMPL_ONLY = 3;

export class FPGATopologyModel {

    projManager: ProjectManager;
    fileService: FileService;

    rootUri: URI;
    contrainsURI: URI;
    implResults: URI;

    constrainsFiles: URI[];
    constrainsFilesUsageMap: Map<URI, number> = new Map<URI, number>();

    constructor(projManager: ProjectManager, fpgaModelRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.rootUri = fpgaModelRoot;
        this.contrainsURI = fpgaModelRoot.resolve('constrains');
        this.implResults = fpgaModelRoot.resolve('implresults');

        this.process();

    }

    private async process() {

        if(await this.fileService.exists(this.contrainsURI) == false){
            this.fileService.createFolder(this.contrainsURI);
        }

        if(await this.fileService.exists(this.implResults) == false){
            this.fileService.createFolder(this.implResults);
        }

        let stats = await this.fileService.resolve(this.contrainsURI);

        if(stats.children){
            this.constrainsFiles = stats.children?.map(i => i.resource);
        }

    }

    public setConstainsFileUsageType(uri: URI, type: number){
        this.constrainsFilesUsageMap.set(uri, type);
    }

    public async constrainsFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.contrainsURI);
    }

}