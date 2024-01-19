import { URI } from '@theia/core/lib/common/uri';
import { FileStat } from '@theia/filesystem/lib/common/files';
import * as utils from '../utils';
import { Path } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

export const defProjStruct = ['system', 'rtl', 'topology', 'other'];

export class Project {

    rootUri: URI;
    rootPath: Path;

    projName: string;

    systemFolderUri: URI;
    rtlFolderUri: URI;
    topologyFolderUri: URI;
    otherFolderUri: URI;

    systemFolderPath: Path;
    rtlFolderPath: Path;
    topologyFolderPath: Path;
    otherFolderPath: Path;

    isFavorite: boolean;    

    public static regexp =  [
                                new RegExp('system', "i"), 
                                new RegExp('rtl', "i"), 
                                new RegExp('topology', "i"), 
                                new RegExp('other', "i")
                            ];
    
    constructor(fileService: FileService, workspaceRoot: FileStat){

        this.rootUri = workspaceRoot.resource;
        this.rootPath = workspaceRoot.resource.path;
        
        this.projName = workspaceRoot.name;

        console.log("Project subdir for paths");

        utils.FSProvider.getSubDirList(fileService, this.rootUri).then(res => {
        
            let dirs = Array.from(res.flatMap(i => i[0][0]));

            console.log(dirs);

            dirs.filter( i => i[0].match(new RegExp('system', "i"))).length   === 1 &&
            dirs.filter( i => i[0].match(new RegExp('rtl', "i"))).length      === 1 &&
            dirs.filter( i => i[0].match(new RegExp('topology', "i"))).length === 1 &&
            dirs.filter( i => i[0].match(new RegExp('other', "i"))).length    === 1 

            this.systemFolderPath = this.rootPath.join(dirs.filter( i => i[0].match(Project.regexp[0]))[0]);
            this.rtlFolderPath = this.rootPath.join(dirs.filter( i => i[0].match(Project.regexp[1]))[0]);
            this.topologyFolderPath = this.rootPath.join(dirs.filter( i => i[0].match(Project.regexp[2]))[0]);
            this.otherFolderPath = this.rootPath.join(dirs.filter( i => i[0].match(Project.regexp[3]))[0]);        

            this.systemFolderUri = URI.fromFilePath(this.systemFolderPath.fsPath());
            this.rtlFolderUri = URI.fromFilePath(this.rtlFolderPath.fsPath());
            this.topologyFolderUri = URI.fromFilePath(this.topologyFolderPath.fsPath());
            this.otherFolderUri = URI.fromFilePath(this.otherFolderPath.fsPath());

        });
        
        this.isFavorite = false;

    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}