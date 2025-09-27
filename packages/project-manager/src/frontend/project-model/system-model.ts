import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ProjectManager } from '../project-manager';
import { URI } from '@theia/core';

export class SystemModel{
 
    projManager: ProjectManager;
    fileService: FileService;

    id = "";
    typeId = "SystemModel";

    name: string = 'System Model';
    uri: URI;

    constructor(projManager: ProjectManager, systemRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.uri = systemRoot.normalizePath();

    }

}