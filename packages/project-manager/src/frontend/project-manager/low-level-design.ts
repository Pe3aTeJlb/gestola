import { URI } from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { ProjectManager } from './project-manager';
import { RTLModel } from './rtl-model';

export const regexp =  [
    new RegExp('rtl'),
    new RegExp('topology'),
];

export interface ConstrainsSet {
    name: string,
    files: URI[]
}

export class LowLevelDesign {

    projManager: ProjectManager;
    fileService: FileService;

    lldName: string;
    lldUri: URI;

    rtlModel: RTLModel;

    topologyUri: URI;
    fpgaUri: URI;
    vlsiUri: URI;

    contrainsSet: ConstrainsSet[] = [];
    
    constructor(projManager: ProjectManager, lldRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.lldName = lldRoot.path.name;
        this.lldUri = lldRoot.normalizePath();

        this.rtlModel = new RTLModel(this.projManager, this.lldUri);

        this.topologyUri = this.lldUri.resolve('topology');
        this.fpgaUri = this.topologyUri.resolve('fpga');
        this.vlsiUri = this.topologyUri.resolve('vlsi');

    }

    //Getters

    public getRTLModel(): RTLModel {
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