import { URI } from "@theia/core";
import { IWaveformDumpDoc, MetadataPackage, TransactionPackage } from "./waveform-doc-dto";
import { SignalId } from "./netlist-dto";
import { RpcServer } from '@theia/core/lib/common/messaging/proxy-factory';

export const WaveformViewerBackendService = Symbol('WaveformViewerBackendService');
export const WAVEFROM_VIEWER_BACKEND_PATH = '/services/waveformViewerBackendService';
export interface WaveformViewerBackendService extends RpcServer<WaveformViewerFrontendService> {
    load(uri: URI): Promise<IWaveformDumpDoc>;
    getSignalData(uri: URI, signalIdList: SignalId[]): void;
    disconnectClient(client: WaveformViewerFrontendService): void;
}

export const WaveformViewerFrontendService = Symbol('WaveformViewerFrontendService');
export interface WaveformViewerFrontendService {
    onTransactionReceived(event: TransactionPackage): void;
    onMetadataReceived(event: MetadataPackage): void;
}