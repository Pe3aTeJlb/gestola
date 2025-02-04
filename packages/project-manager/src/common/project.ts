import { URI } from '@theia/core/lib/common/uri';

export const defProjStruct = ['.theia', 'database', 'system', 'rtl', 'fpga', 'topology', 'other'];

export class Project {

    projName: string;

    rootUri: URI;
    systemUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    topologyUri: URI;
    otherUri: URI;
    databesUri: URI;
    theiaUri: URI;

    target: string = 'zybo';

    isFavorite: boolean = false;

    public static regexp =  [
                                new RegExp('system'), 
                                new RegExp('rtl'), 
                                new RegExp('fpga'), 
                                new RegExp('topology'), 
                                new RegExp('other'),
                                new RegExp('database'),
                                new RegExp('\.theia'),
                            ];
    
    constructor(workspaceRoot: URI){

        let a = workspaceRoot.path.fsPath().split('/').pop();
        if(a) this.projName = a;

        this.rootUri = workspaceRoot.normalizePath();
        this.systemUri = this.rootUri.resolve('system');
        this.rtlUri = this.rootUri.resolve('rtl');
        this.fpgaUri = this.rootUri.resolve('fpga');
        this.topologyUri = this.rootUri.resolve('topology');
        this.otherUri = this.rootUri.resolve('other');
        this.databesUri = this.rootUri.resolve('database');
        this.theiaUri = this.rootUri.resolve('.theia');

    }

    public getRootUri(): URI{
        return this.rootUri;
    }

    public getSystemUri(): URI{
        return this.systemUri;
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

    public getDatabesUri(): URI{
        return this.databesUri;
    }

    public getTheiaUri(): URI{
        return this.theiaUri;
    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

    public async getProjectConfigState(): Promise<Object> {
        return {
            name: this.projName,
            root: this.rootUri,
            systemUri: this.systemUri,
            rtlUri: this.rtlUri,
            fpgaUri: this.fpgaUri,
            topologyUri: this.topologyUri,
            otherUri: this.otherUri
        };
    }

}