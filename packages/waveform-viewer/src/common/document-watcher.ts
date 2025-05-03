import { injectable } from "inversify";
import { Emitter, Event } from '@theia/core/lib/common/event';
import { WaveformViewerFrontendService } from "./protocol";
import { TransactionPackage } from "./waveform-doc-dto";

@injectable()
export class DocumentWatcher {

    getFrontendService(): WaveformViewerFrontendService {
        const newTransactionEmitter = this.onTransactionReceivedEmitter;
        return {
            onTransactionReceived(event: TransactionPackage) {
                newTransactionEmitter.fire(event);
            }
        };
    }

    protected onTransactionReceivedEmitter = new Emitter<TransactionPackage>();

    get onTransactionReceived(): Event<TransactionPackage> {
        return this.onTransactionReceivedEmitter.event;
    }

}