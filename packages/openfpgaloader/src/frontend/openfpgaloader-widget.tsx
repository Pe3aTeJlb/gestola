import * as React from "react";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { FileDialogService } from "@theia/filesystem/lib/browser";
import { inject, injectable, postConstruct } from "inversify";
import { MessageService, nls, URI } from "@theia/core";
import { Message, MessageLoop, Widget } from "@theia/core/lib/browser";
import { SerialMonitorSendInput } from "./input-send";
import { SerialMonitorOutput } from "./output";
import { Emitter } from '@theia/core/lib/common/event';
const openfpgaloader = require("./openFPGALoader");

@injectable()
export class OpenFpgaLoaderWidget extends ReactWidget {

  @inject(MessageService)
  protected readonly messageService!: MessageService;

  static readonly ID = "openfpgaloader:widget";
  static readonly LABEL = nls.localize("gestola/openfpgaloader/widget-title", 'Gestola: OpenFPGALoader');

  private bitstreamPath: string = "";
  private loader: any;
  protected focusNode: HTMLElement | undefined;

  protected readonly bitstreamEmitter = new Emitter<string>();
  protected readonly transactionEmitter = new Emitter<string>();
  protected readonly clearOutputEmitter = new Emitter<void>();

  constructor(
    @inject(FileDialogService)
    private readonly fileDialogService: FileDialogService,

  ) 
  {
    super();
    this.id = OpenFpgaLoaderWidget.ID;
    this.title.label = OpenFpgaLoaderWidget.LABEL;
    this.title.caption = OpenFpgaLoaderWidget.LABEL;
    this.title.closable = true;
    this.title.iconClass = "fa fa-window-maximize"; // example widget icon.
    this.loader = openfpgaloader.Module;
    this.loader.rebindOutput((text:any) => this.addOutput(text));
    this.runCommand = this.runCommand.bind(this);
    this.update();
  }

  @postConstruct()
  protected init(): void {}

  render(): React.ReactElement {
    return (
      <div className="openfpgaloader-widget">
        <div className="header">
          <h2>openFPGALoader GUI</h2>
        </div>
        <div className="controls">
          <div className="control-group">
            <label>Bitstream File:</label>
            <div className="file-input">
              <input
                type="text"
                value={this.bitstreamPath}
                placeholder="Select bitstream file..."
                readOnly={true}
              />
              <button onClick={this.selectBitstreamFile}>Browse</button>
            </div>
          </div>
          <div className="buttons">
            <button onClick={this.detectDevice}>Detect Device</button>
            <button onClick={this.clearOutput}>Clear Output</button>
            <button onClick={this.getHelp}>Help</button>
          </div>
        </div>
        <div className="control-group">
          <h3>Command:</h3>
          <SerialMonitorSendInput  
              bitstream={this.bitstreamEmitter.event}
              resolveFocus={this.onFocusResolved}
              onSend={this.runCommand}
            />
        </div>
        <div className="output-container">
          <h3>Output:</h3>
          <div className="output">
            <SerialMonitorOutput
                transactionEvent={this.transactionEmitter.event}
                clearConsoleEvent={this.clearOutputEmitter.event}
              />
          </div>
        </div>
      </div>
    );
  }

  private selectBitstreamFile = async () => {
    let uri: URI | undefined;
   
    uri = await this.fileDialogService.showOpenDialog({
      title: "Select Bitstream File",
      filters: {
        "Bitstream Files": ["bit"],
        "All Files": ["*"],
      },
    },
  );

    if (uri) {
      this.bitstreamPath = uri.path.toString();
      this.bitstreamEmitter.fire(this.bitstreamPath);
      this.update();
    }
  };

  private detectDevice = async () => {
    this.runCommand("--detect");
    this.addOutput("Device detection not implemented yet");
  };

  protected runCommand(command: string): void {
    console.log(command.split('\s'));
    this.loader.callMain(command.split('\s'));
  }

  private addOutput(message: string) {
    this.transactionEmitter.fire(message+'\n');
    this.update();
  }

  private clearOutput = () => {
    this.clearOutputEmitter.fire(undefined);
    this.update();
  };

  protected onFocusResolved = (element: HTMLElement | undefined): void => {
    if (!this.isAttached) {
      return;
    }
    this.focusNode = element;
    requestAnimationFrame(() =>
      MessageLoop.sendMessage(this, Widget.Msg.ActivateRequest)
    );
  };

  private getHelp = async () => {
    this.runCommand('--help');
  };

  protected displayMessage(): void {
    this.messageService.info(
      "Congratulations: Open FPGA Loader Widget Successfully Created!"
    );
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    (this.focusNode || this.node).focus();
  }

  protected override onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
  }

}
