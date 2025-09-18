import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget, Widget, MessageLoop, Message } from '@theia/core/lib/browser/widgets';
import { SerialMonitorSendInput } from './serial-monitor-send-input';
import { CustomSelect } from './custom-select';
import { SerialMonitorWatcher } from '@gestola/serial-monitor/lib/common/serial-monitor-watcher';
import { ISerialMonitorServer } from '@gestola/serial-monitor/lib/common/protocol';
import { SerialInfo, SerialFilter, getName } from '@gestola/serial-monitor/lib/common/types';
import { SerialMonitorOutput } from './serial-monitor-send-output';
import { nls } from '@theia/core/lib/common';
import { Emitter } from '@theia/core/lib/common/event';
import { QuickInputService } from '@theia/core/lib/common';

export type MonitorEOL = '' | '\n' | '\r' | '\r\n';
export namespace MonitorEOL {
    export const DEFAULT: MonitorEOL = '\n';
}

export const CUSTOM_BAUD = 'Custom';
export const BAUD_RATES = ['115200', '57600', '38400', '19200', '9600', '4800', '2400', '1800', '1200', '600', CUSTOM_BAUD];

@injectable()
export class SerialMonitorWidget extends ReactWidget {

    @inject(SerialMonitorWatcher)
    protected readonly serialMonitorWatcher: SerialMonitorWatcher;

    @inject(ISerialMonitorServer)
    protected readonly serialMonitorBackend: ISerialMonitorServer;

    @inject(QuickInputService)
    private readonly quickInputService: QuickInputService;

    static readonly ID = 'serial-monitor:widget';
    static readonly LABEL = nls.localize("gestola/serial-monitor/widget-title", 'Gestola: Serial Monitor');
    protected widgetHeight: number;
    protected lineEnding: MonitorEOL = MonitorEOL.DEFAULT;
    protected baudRate: number = 9600;
    protected focusNode: HTMLElement | undefined;
    protected closing = false;
    protected autoscroll = true;
    protected timestamp = true;
    protected comPort: SerialInfo | undefined;
    protected comPorts: SerialInfo[];

    protected readonly clearOutputEmitter = new Emitter<void>();

    protected get lineEndings(): SerialMonitorOutput.SelectOption<MonitorEOL>[] {
        return [
          {
            label: nls.localize('gestola/serial-monitor/noLineEndings', 'No Line Ending'),
            value: '',
          },
          {
            label: nls.localize('gestola/serial-monitor/newLine', 'New Line'),
            value: '\n',
          },
          {
            label: nls.localize('gestola/serial-monitor/carriageReturn', 'Carriage Return'),
            value: '\r',
          },
          {
            label: nls.localize(
              'gestola/serial-monitor/newLineCarriageReturn',
              'Both NL & CR'
            ),
            value: '\r\n',
          },
        ];
    }

    constructor(){
      super();
      this.id = SerialMonitorWidget.ID;
      this.title.label = SerialMonitorWidget.LABEL;
      this.title.caption = SerialMonitorWidget.LABEL;
      this.title.closable = true;
      this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
      this.toDispose.push(this.clearOutputEmitter);
    }

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise <void> {
        this.comPorts = await this.serialMonitorBackend.listPorts();
        this.update();
    }

    protected override onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        this.widgetHeight = msg.height;
        this.update();
    }

    protected override onActivateRequest(msg: Message): void {
      super.onActivateRequest(msg);
      (this.focusNode || this.node).focus();
    }

    protected onFocusResolved = (element: HTMLElement | undefined): void => {
      if (this.closing || !this.isAttached) {
        return;
      }
      this.focusNode = element;
      requestAnimationFrame(() =>
        MessageLoop.sendMessage(this, Widget.Msg.ActivateRequest)
      );
    };

    protected override onCloseRequest(msg: Message): void {
      this.closing = true;
      if(this.comPort) this.serialMonitorBackend.close();
      super.onCloseRequest(msg);
    }
  
    protected override onUpdateRequest(msg: Message): void {
      // TODO: `this.isAttached`
      // See: https://github.com/eclipse-theia/theia/issues/6704#issuecomment-562574713
      if (!this.closing && this.isAttached) {
        super.onUpdateRequest(msg);
      }
    }

    toggleTimestamp(): void {
      this.timestamp = !this.timestamp;
      this.update();
    }

    toggleAutoscroll(): void {
      this.autoscroll = !this.autoscroll;
      this.update();
    }

    clearConsole(): void {
      this.clearOutputEmitter.fire(undefined);
      this.update();
    }

    render(): React.ReactElement {
    
      const baudrateOptions = BAUD_RATES.map((b) => ({
        label: nls.localize('gestola/serial-monitor/baudRate', '{0} baud', b),
        value: b,
      }));
      const baudrateSelectedOption = baudrateOptions?.find((b) => parseInt(b.value) === this.baudRate);
  
      const lineEnding = this.lineEndings.find((item) => item.value === this.lineEnding) || MonitorEOL.DEFAULT;

      let comPorts, comPort;

      if(this.comPorts){
        comPorts = this.comPorts.map((e: SerialInfo) => ({label: getName(e), value: e}));
        comPort = comPorts.find(e => e.value === this.comPort);
      }
  
      return (
        <div className="serial-monitor">
          <div className="head">
            <div className="send">
              <SerialMonitorSendInput  
                lineEnding={this.lineEnding}
                resolveFocus={this.onFocusResolved}
                onSend={this.serialMonitorBackend.handleInput}
              />
            </div>
            <div className="config">
                <div className="port">
                  <CustomSelect
                    maxMenuHeight={this.widgetHeight - 40}
                    options={comPorts}
                    value={comPort}
                    onChange={this.onChangeCOMPort}
                  />
                </div>
              <div className="select">
                  <CustomSelect
                    className="select"
                    maxMenuHeight={this.widgetHeight - 40}
                    options={baudrateOptions}
                    value={baudrateSelectedOption}
                    onChange={this.onChangeBaudRate}
                  />
              </div>
              <div className="select">
                <CustomSelect
                  maxMenuHeight={this.widgetHeight - 40}
                  options={this.lineEndings}
                  value={lineEnding}
                  onChange={this.onChangeLineEnding}
                />
              </div>
            </div>
          </div>
          <div className="body">
            <SerialMonitorOutput
              autoscroll={this.autoscroll}
              timestamp={this.timestamp}
              proxy={this.serialMonitorWatcher}
              clearConsoleEvent={this.clearOutputEmitter.event}
              height={Math.floor(this.widgetHeight - 50)}
            />
          </div>
        </div>
      );
    }

    protected readonly onChangeLineEnding = (option: SerialMonitorOutput.SelectOption<MonitorEOL>): void => {
      this.lineEnding = option.value;
      this.update();
    };
  
    protected readonly onChangeBaudRate = async ({value}: { value: string}) => {
      if(value == CUSTOM_BAUD){
        const baud = await this.quickInputService.input({
          title: 'Custom Baud Rate',
          prompt: 'Enter a custom baud rate',
          validateInput: (value: string) => {
              const num = parseInt(value);
              return isNaN(num) || num <= 0 ? Promise.resolve('Please enter a valid positive number') : undefined;
          }
        });
        if(baud) this.baudRate = parseInt(baud);
      } else {
        this.baudRate = parseInt(value);
      }
      if(this.comPort){
        this.serialMonitorBackend.changeBaudrate(this.baudRate);
      }
      this.update();
    };

    protected readonly onChangeCOMPort = ({value}: { value: SerialInfo}): void => {
      if(this.comPort){
        this.serialMonitorBackend.close();
      }
      this.comPort = value;
      this.serialMonitorBackend.createSerialMonitor(this.comPort as SerialFilter, {
        baudRate: this.baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1
    });
    this.update();
    };

}
