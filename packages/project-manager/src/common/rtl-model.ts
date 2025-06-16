import { URI } from '@theia/core/lib/common/uri';

export const defRTLModelStruct = ['rtl', 'fpga', 'vlsi', 'other', '.config'];

export const defRTLModelStructRegexp =  [
    new RegExp('rtl'), 
    new RegExp('fpga'), 
    new RegExp('vlsi'), 
    new RegExp('other')
];

export interface IRTLModel {

    rtlModelName: string;

    rtlModelUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    vlsiUri: URI;
    otherUri: URI;

    target: string;

}