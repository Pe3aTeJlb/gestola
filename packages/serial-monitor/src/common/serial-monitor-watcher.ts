import { injectable } from "inversify";
import { Emitter, Event } from '@theia/core/lib/common/event';
import { ISerialMonitorClient } from "./protocol";

@injectable()
export class SerialMonitorWatcher {

    getClient(): ISerialMonitorClient {
        const newTransactionEmitter = this.onTransactionReceivedEmitter;
        return {
            onTransactionReceived(event: string) {
                newTransactionEmitter.fire(event);
            },
        };
    }

    protected onTransactionReceivedEmitter = new Emitter<string>();

    get onTransactionReceived(): Event<string> {
        return this.onTransactionReceivedEmitter.event;
    }

}