import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileDeleteOptions } from '@theia/filesystem/lib/common/files';
import { ProjectManager } from '../project-manager';
import { RTLModel } from './rtl-model';
import { FPGATopologyModel } from './fpga-topology-model';
import { VLSITopologyModel } from './vlsi-topology-model';

export const regexp =  [
    new RegExp('rtl'),
    new RegExp('topology'),
];

export class LowLevelDesign {

    projManager: ProjectManager;
    fileService: FileService;

    id = "";
    typeId = "LowLevelDesignModel";

    name: string;
    uri: URI;

    rtlModel: RTLModel;

    topologyUri: URI;

    fpgaUri: URI;
    currFPGAModel: FPGATopologyModel | undefined;
    fpgaModels: FPGATopologyModel[] = [];

    vlsiUri: URI;
    currVLSIModel: VLSITopologyModel | undefined;
    vlsiModels: VLSITopologyModel[] = [];

    chip: string = 'xc7a100tcsg324-1';
    
    constructor(projManager: ProjectManager, lldRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.name = lldRoot.path.name;
        this.uri = lldRoot.normalizePath();

        this.rtlModel = new RTLModel(this.projManager, this.uri);

        this.topologyUri = this.uri.resolve('topology');
        this.fpgaUri = this.topologyUri.resolve('fpga');
        this.vlsiUri = this.topologyUri.resolve('vlsi');
    
        this.process();

    }

    private async process() {

        let stats = await this.fileService.resolve(this.fpgaUri);

        if(stats.children){
            for(let i of stats.children){
                this.fpgaModels.push(new FPGATopologyModel(this.projManager, i.resource));
            }
        }

        stats = await this.fileService.resolve(this.vlsiUri);

        if(stats.children){
            for(let i of stats.children){
                this.vlsiModels.push(new VLSITopologyModel(this.projManager, i.resource));
            }
        }

    }

    public setCurrFPGATopologyModel(model: FPGATopologyModel | undefined) {
        this.currFPGAModel = model;
    }

    public createFPGATopologyModel(uri: URI){
        this.fpgaModels.push(new FPGATopologyModel(this.projManager, uri));
    }

    public removeFPGATopologyModel(model: FPGATopologyModel){
        this.fileService.delete(model.uri, {recursive: true} as FileDeleteOptions);
        this.fpgaModels = this.fpgaModels.filter(e => e !== model);
    }

    public async saveMetadata (){
        await this.rtlModel.saveMetadata();
        this.fpgaModels.forEach(async e => await e.saveMetadata());
    }

    //Getters

    public getRTLModel(): RTLModel {
        return this.rtlModel;
    }

    public getCurrFPGATopologyModel(): FPGATopologyModel | undefined {
        return this.currFPGAModel;
    }

    public getRootUri(): URI{ 
        return this.uri;
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