import { URI } from '@theia/core/lib/common/uri';
import { FileStat } from '@theia/filesystem/lib/common/files';
import * as utils from '../utils';
import { Path } from '@theia/core';

export const defProjStruct = ['system', 'rtl', 'topology', 'other'];

export class Project{

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
    
    constructor(workspaceRoot: FileStat){

        this.rootUri = workspaceRoot.resource;
        this.rootPath = workspaceRoot.resource.path;
        
        this.projName = workspaceRoot.name;


        let dirs = utils.FSProvider.getSubDirList(this.rootPath.fsPath());

        
        this.systemFolderPath = this.rootPath.join(dirs.filter( i => i.match(Project.regexp[0]))[0]);
        this.rtlFolderPath = this.rootPath.join(dirs.filter( i => i.match(Project.regexp[1]))[0]);
        this.topologyFolderPath = this.rootPath.join(dirs.filter( i => i.match(Project.regexp[2]))[0]);
        this.otherFolderPath = this.rootPath.join(dirs.filter( i => i.match(Project.regexp[3]))[0]);        

        this.systemFolderUri = URI.fromFilePath(this.systemFolderPath.fsPath());
        this.rtlFolderUri = URI.fromFilePath(this.rtlFolderPath.fsPath());
        this.topologyFolderUri = URI.fromFilePath(this.topologyFolderPath.fsPath());
        this.otherFolderUri = URI.fromFilePath(this.otherFolderPath.fsPath());

        this.isFavorite = false;

    }

    setFavorite() {
        this.isFavorite = !this.isFavorite;
    }

}