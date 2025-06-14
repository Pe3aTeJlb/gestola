import { URI } from '@theia/core/lib/common/uri';
import { IRTLModel } from './rtl-model';

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

    rtlModels: IRTLModel[];
    rtlModelDepTree: undefined;

    isFavorite: boolean;

}