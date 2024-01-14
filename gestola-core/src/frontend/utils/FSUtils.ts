//import * as fs from 'fs';
//import * as path from 'path';
import { URI } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

export namespace FSProvider{

    export async function isDirEmpty(fileService: FileService, path: URI): Promise<boolean> {
        return (await (await fileService.activateProvider(path.scheme)).readdir(path)).length === 0;
        //return fs.readdirSync(path).length === 0;
    }

    export async function createDirStructure(fileService: FileService, basePath: URI, struct: string[]){
        let provider = await fileService.activateProvider(basePath.scheme);
        for (let i = 0; i < struct.length; i++) {
            provider.mkdir(URI.fromFilePath(basePath.path.join(struct[i]).fsPath()));
            //fs.mkdirSync(path.join(basePath, struct[i]));
        }
    }

    export async function getSubDirList(fileService: FileService, path: URI) {
        return await (await fileService.activateProvider(path.scheme)).readdir(path);
        //return fs.readdirSync(path);
    }

}