import { NetlistIdTable, NetlistItem } from './netlist-dto';

export interface IWaveformDumpDoc {

    netlistTree:         NetlistItem[];
    netlistIdTable: NetlistIdTable;

}

export interface TransactionPackage {

    signalId: number;
    transitionDataChunk: string;
    totalChunks: number;
    chunkNum: number;
    min: number;
    max: number;

}
