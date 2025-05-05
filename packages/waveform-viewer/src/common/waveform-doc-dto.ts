import { NetlistIdTable, NetlistItem } from './netlist-dto';
import { URI } from "@theia/core";

export interface IWaveformDumpDoc {

    netlistTree:         NetlistItem[];
    netlistIdTable: NetlistIdTable;

}

export interface TransactionPackage {

    uri: URI;
    signalId: number;
    transitionDataChunk: string;
    totalChunks: number;
    chunkNum: number;
    min: number;
    max: number;

}

export interface MetadataPackage {

    uri: URI;
    metadata: WaveformTopMetadata

}

export type WaveformTopMetadata = {
    timeTableLoaded: boolean;
    moduleCount: number;
    netlistIdCount: number;
    signalIdCount: number;
    timeEnd:     number;
    timeScale:   number;
    defaultZoom: number;
    timeUnit:    string;
  };
