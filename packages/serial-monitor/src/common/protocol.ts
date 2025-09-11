import { SerialFilter, SerialInfo } from "./types";
import { RpcServer } from '@theia/core/lib/common/messaging/proxy-factory';

export const ISerialMonitorServer = Symbol('ISerialMonitorServer');
export const SERIAL_MONITOR_SERVER_BACKEND_PATH = '/services/serial-monitor-backend';
export interface ISerialMonitorServer extends RpcServer<ISerialMonitorClient> {

    disconnectClient(client: ISerialMonitorClient): void;

    listPorts(): Promise<SerialInfo[]>;

    createSerialMonitor(portOrFilter: SerialPort | SerialFilter, options?: SerialOptions): Promise<boolean>;
    
    pause(): void;
    resume(): void;
    close(): void;
    handleInput(data: string): void;

    changeBaudrate(baudRate: number): void;
}


export const ISerialMonitorClient = Symbol('ISerialMonitorClient');
export interface ISerialMonitorClient {
    onTransactionReceived(data: string): void;
}