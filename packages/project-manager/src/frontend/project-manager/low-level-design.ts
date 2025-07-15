import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileDeleteOptions } from '@theia/filesystem/lib/common/files';
import { ProjectManager, FPGATopologyAddEvent, FPGATopologyRemoveEvent } from './project-manager';
import { RTLModel } from './rtl-model';
import { FPGATopologyModel } from './fpga-topology-model';

export const regexp =  [
    new RegExp('rtl'),
    new RegExp('topology'),
];

export class LowLevelDesign {

    projManager: ProjectManager;
    fileService: FileService;

    lldName: string;
    lldUri: URI;

    rtlModel: RTLModel;

    topologyUri: URI;

    fpgaUri: URI;
    currFPGAModel: FPGATopologyModel;
    fpgaModels: FPGATopologyModel[] = [];

    vlsiUri: URI;
    
    
    constructor(projManager: ProjectManager, lldRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.lldName = lldRoot.path.name;
        this.lldUri = lldRoot.normalizePath();

        this.rtlModel = new RTLModel(this.projManager, this.lldUri);

        this.topologyUri = this.lldUri.resolve('topology');
        this.fpgaUri = this.topologyUri.resolve('fpga');
        this.vlsiUri = this.topologyUri.resolve('vlsi');

        this.projManager.onDidAddFPGATopologyModel((event: FPGATopologyAddEvent) => {
            this.fpgaModels.push(new FPGATopologyModel(this.projManager, event.uri));
        });

        this.projManager.onDidRemoveFPGATopologyModel((event: FPGATopologyRemoveEvent) => {
            this.fileService.delete(event.model.rootUri, {recursive: true} as FileDeleteOptions);
            this.fpgaModels = this.fpgaModels.filter(e => e !== event.model);
        });
    
        this.process();

    }

    private async process() {

        let stats = await this.fileService.resolve(this.fpgaUri);

        if(stats.children){
            for(let i of stats.children){
                this.fpgaModels.push(new FPGATopologyModel(this.projManager, i.resource));
            }
        }

    }

    public createFPGATopologyModel(uri: URI){
        this.fpgaModels.push(new FPGATopologyModel(this.projManager, uri));
    }

    //Getters

    public getRTLModel(): RTLModel {
        return this.rtlModel;
    }

    public getCurrFPGATopologyModel(): RTLModel {
        return this.rtlModel;
    }

    public getRootUri(): URI{ 
        return this.lldUri;
    }

    public getFPGAUri(): URI{
        return this.fpgaUri;
    }

    public getVLSIUri(): URI{
        return this.vlsiUri;
    }

    
    
    public async fpgaFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.fpgaUri);
    }

    public async vlsiFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.vlsiUri);
    }

}