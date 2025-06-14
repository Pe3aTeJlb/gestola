import { URI } from '@theia/core/lib/common/uri';
import { IProject } from '../../common/project';
import { RTLModel, regexp as RTLModelRegexp } from './rtl-model';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { ProjectManager } from './project-manager';

export class Project implements IProject {

    projManager: ProjectManager;
    fileService: FileService;

    projName: string;

    rootFStat: FileStat;
    rootUri: URI;

    systemUri: URI;
    databesUri: URI;
    theiaUri: URI;
    configUri: URI;

    curRTLModel: RTLModel | undefined;
    rtlModels: RTLModel[] = [];
    rtlModelDepTree: undefined;

    isFavorite: boolean = false;

    public static regexp =  [
                                new RegExp('system'), 
                                new RegExp('database'),
                                new RegExp('\.theia'),
                                new RegExp('\.config'), 
                            ];

    public async constructProject(projManager: ProjectManager, projectRoot: FileStat): Promise<Project>{

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.rootFStat = projectRoot;

        this.projName = projectRoot.name;

        this.rootUri = this.rootFStat.resource.normalizePath();
        this.systemUri = this.rootUri.resolve('system');
        this.databesUri = this.rootUri.resolve('database');
        this.theiaUri = this.rootUri.resolve('.theia');
        this.configUri = this.rootUri.resolve('.config');

        await this.getRTLModelList(this.rootUri);

        this.curRTLModel = this.rtlModels[0];

        return Promise.resolve(this);

    }

    private async getRTLModelList(projRoot: URI) {

        let dirs = Array.from((await this.readDir(projRoot)).values());

        for (let regexp of Project.regexp) {
            dirs = dirs.filter(i => !i[0].match(regexp));
        }

        for(let dir of dirs){
            let uri = new URI(projRoot.path.join(dir[0]).fsPath());
            if(await this.checkRTLModelStruct(uri)){
                this.rtlModels.push(new RTLModel(this.projManager, uri));
            }
        }

    }

    private async checkRTLModelStruct(path: URI){

        let dirs = Array.from((await this.readDir(path)).values());
        let check = true;

        for (let regexp of RTLModelRegexp) {
            if (dirs.filter( i => i[0].match(regexp)).length !== 1) {check = false; break;}
        }

        return check;

    }

    private async readDir(path: URI) {
        return await (await this.fileService.activateProvider(path.scheme)).readdir(path);
    }


    public async saveMetadata(){
        this.rtlModels.forEach(async e => await e.saveMetadata());
    }


    public getCurrRTLModel(): RTLModel | undefined{
        return this.curRTLModel;
    }

    public setCurrRTLModel(rtlModel: RTLModel){
        this.curRTLModel = rtlModel;
    }

    public removeRTLModel(models: RTLModel[]){
        this.rtlModels = this.rtlModels.filter(i => !models.includes(i));
    }

    public addRTLModel(model: RTLModel){
        this.rtlModels.push(model);
    }



    public getRootUri(): URI{
        return this.rootUri;
    }

    public getSystemUri(): URI{
        return this.systemUri;
    }

    public getDatabesUri(): URI{
        return this.databesUri;
    }

    public getTheiaUri(): URI{
        return this.theiaUri;
    }

    public getConfigUri(): URI {
        return this.configUri;
    }

    public async systemFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.systemUri);
    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}