import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat, FileDeleteOptions } from '@theia/filesystem/lib/common/files';
import { ProjectManager } from '../project-manager';
import { RTLModel } from './rtl-model';
import { FPGATopologyModel } from './fpga-topology-model';

export const regexp =  [
    new RegExp('rtl'),
    new RegExp('topology'),
];

export class LowLevelDesign {

    projManager: ProjectManager;
    fileService: FileService;

    chip: string = 'xc7a100tcsg324-1';

    lldName: string;
    lldUri: URI;

    rtlModel: RTLModel;

    topologyUri: URI;

    fpgaUri: URI;
    currFPGAModel: FPGATopologyModel | undefined;
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

    public setCurrFPGATopologyModel(model: FPGATopologyModel | undefined) {
        this.currFPGAModel = model;
    }

    public createFPGATopologyModel(uri: URI){
        this.fpgaModels.push(new FPGATopologyModel(this.projManager, uri));
    }

    public removeFPGATopologyModel(model: FPGATopologyModel){
        this.fileService.delete(model.rootUri, {recursive: true} as FileDeleteOptions);
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