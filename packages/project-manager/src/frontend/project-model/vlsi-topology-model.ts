import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ProjectManager } from '../project-manager';
import { URI } from '@theia/core';

export class VLSITopologyModel{
 
    projManager: ProjectManager;
    fileService: FileService;

    id = "";
    typeId = "SystemModel";

    name: string;
    uri: URI;

    constructor(projManager: ProjectManager, vlsiModelRoot: URI){

        this.projManager = projManager;
        this.fileService = this.projManager.getFileSerivce();

        this.uri = vlsiModelRoot.normalizePath();

    }

}