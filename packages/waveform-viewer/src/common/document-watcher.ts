import { injectable } from "inversify";
import { Emitter, Event } from '@theia/core/lib/common/event';
import { WaveformViewerFrontendService } from "./protocol";
import { MetadataPackage, TransactionPackage } from "./waveform-doc-dto";

@injectable()
export class DocumentWatcher {

    getFrontendService(): WaveformViewerFrontendService {
        const newTransactionEmitter = this.onTransactionReceivedEmitter;
        const newMetadataEmitter = this.onMetadataReceivedEmitter;
        return {
            onTransactionReceived(event: TransactionPackage) {
                newTransactionEmitter.fire(event);
            },
            onMetadataReceived(event: MetadataPackage) {
                newMetadataEmitter.fire(event);
            }
        };
    }

    protected onTransactionReceivedEmitter = new Emitter<TransactionPackage>();
    protected onMetadataReceivedEmitter = new Emitter<MetadataPackage>();

    get onTransactionReceived(): Event<TransactionPackage> {
        return this.onTransactionReceivedEmitter.event;
    }

    get onMetadataReceived(): Event<MetadataPackage> {
        return this.onMetadataReceivedEmitter.event;
    }

}