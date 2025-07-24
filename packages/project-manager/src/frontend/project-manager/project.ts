import { URI } from '@theia/core/lib/common/uri';
import { IProject } from '../../common/project';
import { LowLevelDesign, regexp as RTLModelRegexp } from './low-level-design';
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
    lldsRootUri: URI;
    miscUri: URI;
    databesUri: URI;
    sqliteDBUri: URI;
    theiaUri: URI;
    configUri: URI;

    curLLD: LowLevelDesign | undefined;
    LowLevelDesignes: LowLevelDesign[] = [];
    rtlModelDepTree: undefined;

    isFavorite: boolean = false;

    public static regexp =  [
                                new RegExp('system'),
                                new RegExp('low_level_design'),
                                new RegExp('misc'),  
                                new RegExp('database'),
                                new RegExp('\.theia'),
                                new RegExp('\.config'), 
                            ];

    public constructor(projManager: ProjectManager, projectRoot: FileStat) {

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.rootFStat = projectRoot;

        this.projName = projectRoot.name;

        this.rootUri = this.rootFStat.resource.normalizePath();
        this.systemUri = this.rootUri.resolve('system');
        this.lldsRootUri = this.rootUri.resolve('low_level_design');
        this.miscUri = this.rootUri.resolve('misc');
        this.databesUri = this.rootUri.resolve('database');
        this.sqliteDBUri = this.databesUri.resolve('sqlite.db');
        this.theiaUri = this.rootUri.resolve('.theia');
        this.configUri = this.rootUri.resolve('.config');

        this.projManager.getDatabaseService().createSQLiteConnection(this.sqliteDBUri);

        this.getLowLevelDesignList(this.lldsRootUri);

    }

    private async getLowLevelDesignList(lldsRoot: URI) {

        let dirs = Array.from((await this.readDir(lldsRoot)).values());

        for(let dir of dirs){
            let uri = new URI(lldsRoot.path.join(dir[0]).fsPath());
            if(await this.checkLLDStruct(uri)){
                this.LowLevelDesignes.push(new LowLevelDesign(this.projManager, uri));
            }
        }

        this.curLLD = this.LowLevelDesignes[0];

    }

    private async checkLLDStruct(path: URI){

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
        this.LowLevelDesignes.forEach(async e => await e.getRTLModel().saveMetadata());
    }


    public getCurrLLD(): LowLevelDesign | undefined {
        return this.curLLD;
    }

    public setCurrLLD(lld: LowLevelDesign){
        this.curLLD = lld;
    }

    public removeLLD(lld: LowLevelDesign[]){
        this.LowLevelDesignes = this.LowLevelDesignes.filter(i => !lld.includes(i));
    }

    public addLLD(lld: LowLevelDesign){
        this.LowLevelDesignes.push(lld);
    }



    public getRootUri(): URI{
        return this.rootUri;
    }

    public getSystemUri(): URI{
        return this.systemUri;
    }

    public getMiscUri(): URI{
        return this.miscUri;
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

    public async miscFolderFStat(): Promise<FileStat> {
        return await this.fileService.resolve(this.miscUri);
    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}