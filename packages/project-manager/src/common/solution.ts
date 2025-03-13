import { URI } from '@theia/core/lib/common/uri';

export const defSolutionStruct = ['rtl', 'fpga', 'topology', 'other', '.config'];

export const defSolutionStructRegexp =  [
    new RegExp('rtl'), 
    new RegExp('fpga'), 
    new RegExp('topology'), 
    new RegExp('other')
];

export interface ISolution {

    solutionName: string;

    solutionUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    topologyUri: URI;
    otherUri: URI;

    target: string;

}