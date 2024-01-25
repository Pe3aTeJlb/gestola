import { URI } from '@theia/core/lib/common/uri';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { Path } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

export const defProjStruct = ['system', 'rtl', 'topology', 'other'];

export class Project {

    rootFStat: FileStat;
    rootUri: URI;
    rootPath: Path;

    projName: string;

    systemFolderFStat: FileStat;
    rtlFolderFStat: FileStat;
    topologyFolderFStat: FileStat;
    otherFolderFStat: FileStat;

    isFavorite: boolean;    

    public static regexp =  [
                                new RegExp('system', "i"), 
                                new RegExp('rtl', "i"), 
                                new RegExp('topology', "i"), 
                                new RegExp('other', "i")
                            ];
    
    constructor(fileService: FileService, workspaceRoot: FileStat){

        this.rootFStat = workspaceRoot;
        this.rootUri = workspaceRoot.resource;
        this.rootPath = workspaceRoot.resource.path;
        
        this.projName = workspaceRoot.name;

        if(this.rootFStat.children){
            fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[0]))[0].resource.normalizePath()).then(res => this.systemFolderFStat = res);
            fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[1]))[0].resource.normalizePath()).then(res => this.rtlFolderFStat = res);
            fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[2]))[0].resource.normalizePath()).then(res => this.topologyFolderFStat = res);
            fileService.resolve(this.rootFStat.children.filter(i => i.name.match(Project.regexp[3]))[0].resource.normalizePath()).then(res => this.otherFolderFStat = res);
        }

        this.isFavorite = false;

    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}