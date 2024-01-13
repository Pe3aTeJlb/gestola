import * as fs from 'fs';
import * as path from 'path';

export namespace FSProvider{

    export function isDirEmpty(path: string): boolean{
        return fs.readdirSync(path).length === 0;
    }

    export function createDirStructure(basePath: string, struct: string[]){
        for (let i = 0; i < struct.length; i++) {
            fs.mkdirSync(path.join(basePath, struct[i]));
        }
    }

    export function getSubDirList(path: string){
        return fs.readdirSync(path);
    }

}