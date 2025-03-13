import { URI } from '@theia/core/lib/common/uri';
import { ISolution } from './solution';

export const defProjStruct = ['.theia', 'database', 'system', '.config'];

export const defProjStructRegexp =  [
    new RegExp('system'), 
    new RegExp('database'),
    new RegExp('\.theia')
];

export interface IProject {

    projName: string;

    rootUri: URI;
    systemUri: URI;
    databesUri: URI;
    theiaUri: URI;

    solutions: ISolution[];
    solutionDepTree: undefined;

    isFavorite: boolean;

}