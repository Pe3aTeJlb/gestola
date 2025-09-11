import { SerialFilter, SerialInfo } from "./types";

export const SerialMonitorBackedService = Symbol('SerialMonitorBackedService');
export const SERIAL_MONITOR_BACKEND_PATH = '/services/serial-monitor-backend';
export interface SerialMonitorBackedService {
    listPorts(): Promise<SerialInfo[]>;
    createSerialMonitor(portOrFilter: SerialPort | SerialFilter, options?: SerialOptions): Promise<boolean>;
    handleInput(data: string): void;
}