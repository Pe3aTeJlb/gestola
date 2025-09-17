import * as React from "react";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { FileDialogService } from "@theia/filesystem/lib/browser";
import { inject, injectable, postConstruct } from "inversify";
import { MessageService } from "@theia/core";
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
  static readonly LABEL = "Gestola: FPGA Loader";

  private bitstreamPath: string = "";
  private deviceType: string = "";
  private cableType: string = "";
  private flashMode: string = "SRAM";

  private loader: any;
  protected focusNode: HTMLElement | undefined;

  protected readonly transactionEmitter = new Emitter<string>();
  protected readonly clearOutputEmitter = new Emitter<void>();

  constructor(
    @inject(FileDialogService)
    private readonly fileDialogService: FileDialogService
  ) //@inject(WorkspaceService) private readonly workspaceService: WorkspaceService
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
          <div className="control-group">
            <label>Cable Type:</label>
            <select value={this.cableType} onChange={this.handleCableChange}>
              <option value="">Select cable</option>
              <option value="ftdi">FTDI</option>
              <option value="digilent">Digilent</option>
              <option value="cmsisdap">CMSIS-DAP</option>
            </select>
          </div>
          <div className="control-group">
            <label>Device Type:</label>
            <select value={this.deviceType} onChange={this.handleDeviceChange}>
              <option value="">Select device</option>
              <option value="xc7a35t">Xilinx Artix-7 (xc7a35t)</option>
              <option value="xc7s50">Xilinx Spartan-7 (xc7s50)</option>
              <option value="ice40">Lattice iCE40</option>
              <option value="ecp5">Lattice ECP5</option>
              <option value="gowin">Gowin FPGA</option>
            </select>
          </div>
          <div className="control-group">
            <label>Programming Mode:</label>
            <select value={this.flashMode} onChange={this.handleModeChange}>
              <option value="SRAM">SRAM (Volatile)</option>
              <option value="FLASH">FLASH (Non-volatile)</option>
            </select>
          </div>
          <div className="buttons">
            <button
              onClick={this.programDevice}
              disabled={!this.canProgram()}
              className="program-btn"
            >
            </button>
            <button onClick={this.detectDevice}>Detect Device</button>
            <button onClick={this.clearOutput}>Clear Output</button>
            <button onClick={this.getHelp}>Help</button>
          </div>
        </div>
        <div className="control-group">
          <h3>Command:</h3>
          <SerialMonitorSendInput  
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
    const uri = await this.fileDialogService.showOpenDialog({
      title: "Select Bitstream File",
      filters: {
        "Bitstream Files": [".bit", ".bin", ".svf", ".jed"],
        "All Files": ["*"],
      },
    });

    if (uri) {
      this.bitstreamPath = uri.path.toString();
      this.update();
    }
  };

  private handleDeviceChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    this.deviceType = event.target.value;
    this.update();
  };

  private handleCableChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.cableType = event.target.value;
    this.update();
  };

  private handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    this.flashMode = event.target.value;
    this.update();
  };

  private canProgram(): boolean {
    return (
      this.bitstreamPath !== "" &&
      this.deviceType !== "" &&
      this.cableType !== ""
    );
  }

  private programDevice = async () => {
   
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
