import * as theia from '@theia/plugin';
import { injectable } from '@theia/core/shared/inversify';
import { SerialPort } from 'serialport';
import { PortInfo } from '@serialport/bindings-cpp';
import { SerialFilter, isSerialPort } from '../common/types';
import { ISerialMonitorServer, ISerialMonitorClient } from '../common/protocol';
import { DesktopSerialDevice } from './desktop-serial-device';
import { SerialDevice, SerialPortDevice } from './serial-device';
import { Event, Emitter } from "@theia/core";

@injectable()
export class SerialMonitorServer implements ISerialMonitorServer, theia.Pseudoterminal {

    protected clients: ISerialMonitorClient[] = [];

    private serialDevice: SerialDevice | undefined;
    private options: SerialOptions = {
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1
    };
    private writeEmitter = new Emitter<string>();
    public onDidWrite: Event<string> = this.writeEmitter.event;
    private closeEmitter = new Emitter<number>();
    public onDidClose: Event<number> = this.closeEmitter.event;
    public closed = false;

    public constructor(){
        this.onDidWrite(e => this.clients.forEach(c => c.onTransactionReceived(e)));
    }

    dispose(): void {  
        this.close();
    }

    setClient(client: ISerialMonitorClient): void {
        this.clients.push(client);
    }

    disconnectClient(client: ISerialMonitorClient): void {
        const idx = this.clients.indexOf(client);
        if (idx > -1) {
            this.clients.splice(idx, 1);
        }
    }

    public async listPorts(): Promise<PortInfo[]> {
        return await SerialPort.list();
    }

    public async createSerialMonitor(portOrFilter: SerialPort | SerialFilter, options?: SerialOptions): Promise<boolean> {
        
        if(!portOrFilter){
            return false;
        }

        if (isSerialPort(portOrFilter)) {
            this.serialDevice = new SerialPortDevice(portOrFilter);
        } else {
            let port = await this.getPortInfo(portOrFilter);
            if (!port) { return false; }
            this.serialDevice = new DesktopSerialDevice(port);
        }

        if(options) {
            this.options = options;
        }

        this.open();

        return this.serialDevice == undefined;

    }

    protected async getPortInfo(filter?: SerialFilter): Promise<PortInfo | undefined> {
        if (filter && (filter.serialNumber || filter.path || (filter.vendorId && filter.productId))) {
            let port: PortInfo | undefined;

            for (let i = 0; i < 3; i ++) {
                const ports = await SerialPort.list();

                if (filter.serialNumber) {
                    port = ports.find(info => info.serialNumber === filter.serialNumber);
                } else if (filter.path) {
                    port = ports.find(info => info.path === filter.path);
                } else {
                    port = ports.find(info => info.vendorId === filter.vendorId && info.productId === filter.productId);
                }

                if (port) {
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            return port;
        }
    }

    public async open(): Promise<void> {
        if(this.serialDevice){
            this.serialDevice.onData((data: any) => this.writeOutput(data));
            this.serialDevice.onEnd(() => {
                if (!this.closed) {
                    this.closed = true;
                    this.closeEmitter.fire(0);
                }
            });

            this.serialDevice.open(this.options);
            this.writeLine(`Opened with baud rate: ${this.options.baudRate}`);
        }
    }

    public pause(): void {
        if(this.serialDevice) this.serialDevice.pause();
    }
    public resume(): void {
        if(this.serialDevice) this.serialDevice.resume();
    }

    public close(): void {
        if(this.serialDevice) this.serialDevice.close();
    }

    public handleInput(data: string): void {
        this.writeOutput("client: " + data);
        if(this.serialDevice) this.serialDevice.send(data);
    }

    protected writeLine(message: string): void {
        this.writeOutput(`${message}\n`);
    }

    protected writeOutput(message: string): void {
        const output = message.replace(/\r/g, '').replace(/\n/g, '\r\n');
        //console.log('server :', output, '"');
        this.writeEmitter.fire(output);
    }

    public async changeBaudrate(baudRate: number) {
        if (!this.serialDevice) {
            return;
        }

        this.close();
        this.options.baudRate = baudRate;
        this.open();

    }

}
