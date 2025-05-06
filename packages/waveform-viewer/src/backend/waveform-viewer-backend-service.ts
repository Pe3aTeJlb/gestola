import { injectable } from '@theia/core/shared/inversify';
import { URI } from '@theia/core';
import { WaveformViewerFrontendService, WaveformViewerBackendService } from '../common/protocol';
import * as fs from 'fs';
import { WaveformDumpDoc } from './document/waveform-dump-doc';
import { Worker } from 'worker_threads';
import { IWaveformDumpDoc } from '../common/waveform-doc-dto';

@injectable()
export class WaveformViewverBackendServiceImpl implements WaveformViewerBackendService {

    protected clients: WaveformViewerFrontendService[] = [];
    documentMap = new Map<string, WaveformDumpDoc>();

    wasmDebug: string   = 'debug';
    wasmRelease : string= 'release';
    wasmBuild: string   = this.wasmRelease;
    wasmModule: WebAssembly.Module;
    wasmWorker: Worker;

    disconnectClient(client: WaveformViewerFrontendService): void {
        const idx = this.clients.indexOf(client);
        if (idx > -1) {
            this.clients.splice(idx, 1);
        }
    }
    dispose(): void {
       // throw new Error('Method not implemented.');
    }
    setClient(client: WaveformViewerFrontendService): void {
        this.clients.push(client);
    }
    getClient?(): WaveformViewerFrontendService | undefined {
        return undefined;
        
    }

    async load(uri: URI): Promise<IWaveformDumpDoc> {

        let wasmWorker;
        const workerFile = new URI(__dirname).resolveToAbsolute("..", "..", "resources",'waveform',"document", "worker.js")?.path.fsPath();
        if(workerFile){
            wasmWorker = new Worker(workerFile);
        }

        if(!this.wasmModule){
            const binaryFile = new URI(__dirname).resolveToAbsolute("..", "..", 'resources','waveform', 'target', 'wasm32-unknown-unknown', this.wasmBuild, 'filehandler.wasm');

            if(binaryFile){
                const binaryData = fs.readFileSync(binaryFile.path.fsPath());
                this.wasmModule = await WebAssembly.compile(binaryData);
            }
        }

        let document: WaveformDumpDoc = await WaveformDumpDoc.create(this.clients[0], uri, wasmWorker!, this.wasmModule);
        this.documentMap.set(uri.path.fsPath(), document);

        return document as IWaveformDumpDoc;

    }

    getSignalData(uri: URI, signalIdList: number[]): void {
        console.log('file path', uri.path.fsPath());
        this.documentMap.get(uri.path.fsPath())?.getSignalData(signalIdList);
    }

}