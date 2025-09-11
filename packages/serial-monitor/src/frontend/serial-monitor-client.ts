import { inject, injectable } from '@theia/core/shared/inversify';
import { SerialFilter, SerialInfo, getName } from '../common/types';
import { ISerialMonitorServer} from '../common/protocol';
import { QuickPickService, QuickInputService, QuickPickValue, QuickPickItem } from '@theia/core/lib/common';
import { SerialMonitorWatcher } from '../common/serial-monitor-watcher';

export const CUSTOM_BAUD = 'Custom...';
export const BAUD_RATES = ['115200', '57600', '38400', '19200', '9600', '4800', '2400', '1800', '1200', '600', CUSTOM_BAUD];

const isSerialPort = (portOrFilter?: SerialPort | SerialFilter): portOrFilter is SerialPort => !!(portOrFilter as SerialPort)?.getInfo;

class PortItem implements QuickPickItem {
    public label: string;
    public constructor(public port: SerialInfo) {
        this.label = getName(port);
    }
}

@injectable()
export class SerialMonitorClient {

    @inject(QuickPickService)
    private readonly quickPickService: QuickPickService;

    @inject(QuickInputService)
    private readonly quickInputService: QuickInputService;

    @inject(ISerialMonitorServer)
    private readonly seriaMonitorBackendService: ISerialMonitorServer;

    @inject(SerialMonitorWatcher)
    private readonly serialMonitorWatcher: SerialMonitorWatcher;

    constructor(){

    }


    public async listPorts(): Promise<SerialInfo[]> {
        return this.seriaMonitorBackendService.listPorts();
    }

    public write(line: string){
        this.seriaMonitorBackendService.handleInput(line);
    }

    public handleData(data: string): void {
        console.log(data);
    }

    public async openSerial(portOrFilter?: SerialPort | SerialFilter, options?: SerialOptions, name?: string) {

        if (isSerialPort(portOrFilter)) {
            this.seriaMonitorBackendService.createSerialMonitor(portOrFilter);
        } else if (portOrFilter != undefined) {
            this.seriaMonitorBackendService.createSerialMonitor(portOrFilter);
        } else {
            this.seriaMonitorBackendService.createSerialMonitor(await this.selectSerialPort() as SerialFilter);
        }

        this.serialMonitorWatcher.onTransactionReceived(event => {
            console.log(event)
        });
        
    }

    protected async selectSerialPort(): Promise<SerialInfo | undefined> {
        let port: SerialInfo | undefined;

        const ports = await this.listPorts();
        const items = ports.map(port => new PortItem(port));
        const selected = await this.quickPickService.show(items, { title: 'Please select a serial port' });
        if (selected) {
            port = selected.port;
        }

        return port;
    }

    protected async getBaudrate(currentBaudrate?: string): Promise<string | undefined> {
        if (!currentBaudrate || !BAUD_RATES.includes(currentBaudrate)) {
            currentBaudrate =  '9600';
        }
        let baud = (await this.quickPickService.show(BAUD_RATES.map((e: string) => <QuickPickValue<string>>{ label: e, value: e }), { title: 'Select a baud rate' }))?.value;
        if (baud === CUSTOM_BAUD) {
            baud = await this.quickInputService.input({
                title: 'Custom Baud Rate',
                prompt: 'Enter a custom baud rate',
                validateInput: (value: string) => {
                    const num = parseInt(value);
                    return isNaN(num) || num <= 0 ? Promise.resolve('Please enter a valid positive number') : undefined;
                }
            });
        }

        return baud;
    }

}