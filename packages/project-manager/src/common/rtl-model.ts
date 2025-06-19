import { URI } from '@theia/core/lib/common/uri';

export const defRTLModelStruct = ['rtl', 'fpga', 'vlsi'];

export const defRTLModelStructRegexp =  [
    new RegExp('rtl'), 
    new RegExp('fpga'), 
    new RegExp('vlsi'), 
];

export interface IRTLModel {

    rtlModelName: string;

    rtlModelUri: URI;
    rtlUri: URI;
    fpgaUri: URI;
    vlsiUri: URI;

    target: string;

}