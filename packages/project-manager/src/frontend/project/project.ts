import { URI } from '@theia/core/lib/common/uri';
import { LowLevelDesign, regexp as RTLModelRegexp } from './low-level-design';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { ProjectManager } from '../project-manager';
import { Database } from '../../common/database';
import { SystemModel } from './system-model';

export class Project {

    projManager: ProjectManager;
    fileService: FileService;

    id = "";
    typeId = "ProjectModel";

    name: string;

    rootFStat: FileStat;
    uri: URI;

    systemUri: URI;
    lldsRootUri: URI;
    miscUri: URI;
    databesUri: URI;
    analyticsDBUri: URI;
    systemDBUri: URI;
    theiaUri: URI;
    configUri: URI;
    analyticsUri: URI;
    dashboardsUri: URI;

    systemModel: SystemModel;

    curLLD: LowLevelDesign | undefined;
    lowLevelDesignes: LowLevelDesign[] = [];
    rtlModelDepTree: undefined;

    reportDatabaseDescription: Database;

    isFavorite: boolean = false;

    public static regexp =  [
                                new RegExp('system'),
                                new RegExp('low_level_design'),
                                new RegExp('misc'),  
                                new RegExp('analytics'),
                                new RegExp('database'),
                                new RegExp('\.theia'),
                                new RegExp('\.config'),
                            ];

    public constructor(projManager: ProjectManager, projectRoot: FileStat) {

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.rootFStat = projectRoot;

        this.name = projectRoot.name;

        this.uri = this.rootFStat.resource.normalizePath();
        this.systemUri = this.uri.resolve('system');
        this.lldsRootUri = this.uri.resolve('low_level_design');
        this.miscUri = this.uri.resolve('misc');
        this.databesUri = this.uri.resolve('database');
        this.analyticsDBUri = this.databesUri.resolve('analytics.db');
        this.systemDBUri = this.databesUri.resolve('system.db');
        this.theiaUri = this.uri.resolve('.theia');
        this.configUri = this.uri.resolve('.config');
        this.analyticsUri = this.uri.resolve('analytics');
        this.dashboardsUri = this.analyticsUri.resolve('dashboards');

        this.systemModel = new SystemModel(this.projManager, this.systemUri)
        this.getDatabaseDescription(this.analyticsDBUri);
        this.getLowLevelDesignList(this.lldsRootUri);

    }

    private async getDatabaseDescription(sqliteUri: URI){
        if(await this.fileService.exists(sqliteUri)){
            this.reportDatabaseDescription = await this.projManager.getDatabaseService().getDatabaseDescription(sqliteUri);
        }
    }

    private async getLowLevelDesignList(lldsRoot: URI) {

        let dirs = Array.from((await this.readDir(lldsRoot)).values());

        for(let dir of dirs){
            let uri = new URI(lldsRoot.path.join(dir[0]).fsPath());
            if(await this.checkLLDStruct(uri)){
                this.lowLevelDesignes.push(new LowLevelDesign(this.projManager, uri));
            }
        }

        this.curLLD = this.lowLevelDesignes[0];

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
        this.lowLevelDesignes.forEach(async e => await e.saveMetadata());
    }


    public getCurrLLD(): LowLevelDesign | undefined {
        return this.curLLD;
    }

    public setCurrLLD(lld: LowLevelDesign){
        this.curLLD = lld;
    }

    public removeLLD(lld: LowLevelDesign[]){
        this.lowLevelDesignes = this.lowLevelDesignes.filter(i => !lld.includes(i));
    }

    public addLLD(lld: LowLevelDesign){
        this.lowLevelDesignes.push(lld);
    }



    public getRootUri(): URI{
        return this.uri;
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

    public async dashboardsFstat(): Promise<FileStat> {
        return await this.fileService.resolve(this.dashboardsUri);
    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}