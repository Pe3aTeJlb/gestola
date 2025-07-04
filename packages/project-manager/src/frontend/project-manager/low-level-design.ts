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
    contrainsURI: URI;

    contrainsSetRoots: URI[] = [];
    
    constructor(projManager: ProjectManager, lldRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.lldName = lldRoot.path.name;
        this.lldUri = lldRoot.normalizePath();

        this.rtlModel = new RTLModel(this.projManager, this.lldUri);

        this.topologyUri = this.lldUri.resolve('topology');
        this.fpgaUri = this.topologyUri.resolve('fpga');
        this.vlsiUri = this.topologyUri.resolve('vlsi');

        this.contrainsURI = this.fpgaUri.resolve('constrains');
    
        this.process();

    }

    private async process() {

        let stats = await this.fileService.resolve(this.contrainsURI);

        let roots: URI[] | undefined = stats.children?.map(i => i.resource);
        if(roots) this.contrainsSetRoots = roots;

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

    public async constrainsFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.contrainsURI);
    }

    public async vlsiFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.vlsiUri);
    }

}