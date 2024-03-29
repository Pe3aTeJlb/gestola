import { URI } from '@theia/core/lib/common/uri';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { Path } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

export const defProjStruct = ['system', 'rtl', 'topology', 'other', '.theia', 'fpga'];

export class Project {

    fileService: FileService

    rootFStat: FileStat;
    rootUri: URI;
    rootPath: Path;

    projName: string;

    isFavorite: boolean;    

    public static regexp =  [
                                new RegExp('system', "i"), 
                                new RegExp('rtl', "i"), 
                                new RegExp('fpga', "i"), 
                                new RegExp('topology', "i"), 
                                new RegExp('other', "i"),

                            ];
    
    constructor(fileService: FileService, workspaceRoot: FileStat){

        this.fileService = fileService;

        this.rootFStat = workspaceRoot;
        this.rootUri = workspaceRoot.resource;
        this.rootPath = workspaceRoot.resource.path;
        
        this.projName = workspaceRoot.name;

        this.isFavorite = false;

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

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}