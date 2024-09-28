import { URI } from '@theia/core/lib/common/uri';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { Path } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { Database } from 'sqlite';
import { ProjectManager } from './project-manager';

export class Project {

    fileService: FileService

    rootFStat: FileStat;
    rootUri: URI;
    rootPath: Path;

    projName: string;

    isFavorite: boolean;  

    SQLITE: Database;
    NEDB: undefined;

    public static regexp =  [
                                new RegExp('system', "i"), 
                                new RegExp('rtl', "i"), 
                                new RegExp('fpga', "i"), 
                                new RegExp('topology', "i"), 
                                new RegExp('other', "i"),
                                new RegExp('database', "i"),
                                new RegExp('\.theia', "i"),
                            ];
    
    constructor(projManager: ProjectManager, workspaceRoot: FileStat){

        this.fileService = projManager.getFileSerivce();

        this.rootFStat = workspaceRoot;
        this.rootUri = workspaceRoot.resource;
        this.rootPath = workspaceRoot.resource.path;
        
        this.projName = workspaceRoot.name;

        this.isFavorite = false;

        this.createDBConnections(projManager);

    }

    private async createDBConnections(projManager: ProjectManager){
        let uri = this.getRDBFile();
        if(uri){
            this.SQLITE = await projManager.getDatabaseService().createSQLiteConnection(uri);
        }
    }

    
    public async systemFolderFStat(): Promise<FileStat | undefined> {
        if(this.rootFStat.children){
            return await this.fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[0]))[0].resource.normalizePath());
        }
    }
    public async rtlFolderFStat(): Promise<FileStat | undefined> {
        if(this.rootFStat.children){
            return await this.fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[1]))[0].resource.normalizePath());
        }
    }
    public async fpgaFolderFStat(): Promise<FileStat | undefined> {
        if(this.rootFStat.children){
            return await this.fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[2]))[0].resource.normalizePath());
        }
    }
    public async topologyFolderFStat(): Promise<FileStat | undefined> {
        if(this.rootFStat.children){
            return await this.fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[3]))[0].resource.normalizePath());
        }
    }
    public async otherFolderFStat(): Promise<FileStat | undefined> {
        if(this.rootFStat.children){
            return await this.fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[4]))[0].resource.normalizePath());
        }
    }

    public getRDBFile(): URI | undefined {
        return this.rootFStat.children?.filter(i => i.name.match(Project.regexp[5]))[0].resource.normalizePath().resolve("sqlite.db");
    }

    public getNRDBFile(): URI | undefined {
        if(this.rootFStat.children){
            return this.rootFStat.children?.filter(i => i.name.match(Project.regexp[5]))[0].resource.normalizePath().resolve("nedb.db");
        }
    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}