import { URI } from '@theia/core/lib/common/uri';

export const defRTLModelStruct = ['rtl', 'fpga', 'topology', 'other', '.config'];

export const defRTLModelStructRegexp =  [
    new RegExp('rtl'), 
    new RegExp('fpga'), 
    new RegExp('topology'), 
    new RegExp('other')
];

export interface IRTLModel {

    rtlModelName: string;

    rtlModelUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    topologyUri: URI;
    otherUri: URI;

    target: string;

}