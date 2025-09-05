import * as React from 'react';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FileDialogService } from '@theia/filesystem/lib/browser';
//import { WorkspaceService } from '@theia/workspace/lib/browser';
import {  inject, injectable, postConstruct } from 'inversify';
import { MessageService } from '@theia/core';
import { Message } from '@theia/core/lib/browser';
const openfpgaloader = require("./openFPGALoader");

@injectable()
export class OpenFpgaLoaderWidget extends ReactWidget {

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    static readonly ID = 'openfpgaloader:widget';
    static readonly LABEL = 'Gestola: FPGA Loader';

    private bitstreamPath: string = '';
    private deviceType: string = '';
    private cableType: string = '';
    private flashMode: string = 'SRAM';
    private output: string[] = [];
    private isProgramming: boolean = false;

    constructor(
        @inject(FileDialogService) private readonly fileDialogService: FileDialogService,
        //@inject(WorkspaceService) private readonly workspaceService: WorkspaceService
    ) {
        super();
    }

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise <void> {
        this.id = OpenFpgaLoaderWidget.ID;
        this.title.label = OpenFpgaLoaderWidget.LABEL;
        this.title.caption = OpenFpgaLoaderWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.update();

    }

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
                                readOnly
                            />
                            <button onClick={this.selectBitstreamFile}>Browse</button>
                        </div>
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
                        <label>Cable Type:</label>
                        <select value={this.cableType} onChange={this.handleCableChange}>
                            <option value="">Select cable</option>
                            <option value="ftdi">FTDI</option>
                            <option value="digilent">Digilent</option>
                            <option value="cmsisdap">CMSIS-DAP</option>
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
                            disabled={this.isProgramming || !this.canProgram()}
                            className="program-btn"
                        >
                            {this.isProgramming ? 'Programming...' : 'Program Device'}
                        </button>
                        <button onClick={this.detectDevice}>Detect Device</button>
                        <button onClick={this.clearOutput}>Clear Output</button>
                        <button onClick={this.getHelp}>Help</button>
                    </div>
                </div>

                <div className="output-container">
                    <h3>Output:</h3>
                    <div className="output">
                        {this.output.map((line, index) => (
                            <div key={index} className="output-line">{line}</div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    private getHelp = async () => {

        console.log("lol1", openfpgaloader);
        //let kek3 = await this.openfpgaloader.run(['--help']);
        let kek2 = openfpgaloader.Module.callMain(['--help']);
        console.log("lol2");
        console.log("lol3", kek2);
    };

    private selectBitstreamFile = async () => {
        const uri = await this.fileDialogService.showOpenDialog({
            title: 'Select Bitstream File',
            filters: {
                'Bitstream Files': ['.bit', '.bin', '.svf', '.jed'],
                'All Files': ['*']
            }
        });

        if (uri) {
            this.bitstreamPath = uri.path.toString();
            this.update();
        }
    };

    private handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
        return this.bitstreamPath !== '' && this.deviceType !== '' && this.cableType !== '';
    }

    private programDevice = async () => {
        this.isProgramming = true;
        this.addOutput('Starting programming process...');
        this.update();

        try {
            // Simulate openFPGALoader command execution
            const command = `openfpgaloader -b ${this.cableType} -f ${this.flashMode} -c ${this.deviceType} "${this.bitstreamPath}"`;
            this.addOutput(`Executing: ${command}`);
            
            // In a real implementation, you would use Theia's process service
            // to execute the openfpgaloader command
            await this.simulateProgramming();
            
            this.addOutput('Programming completed successfully!');
        } catch (error) {
            this.addOutput(`Error: ${error}`);
        } finally {
            this.isProgramming = false;
            this.update();
        }
    };

    private detectDevice = async () => {
        this.addOutput('Detecting FPGA device...');
        // Implement device detection logic
        this.addOutput('Device detection not implemented yet');
    };

    private clearOutput = () => {
        this.output = [];
        this.update();
    };

    private addOutput(message: string) {
        this.output.push(`${new Date().toLocaleTimeString()}: ${message}`);
        this.update();
    }

    private async simulateProgramming(): Promise<void> {
        // Simulate programming process with progress updates
        const steps = [
            'Initializing programmer...',
            'Connecting to device...',
            'Reading device information...',
            'Erasing flash (if needed)...',
            'Programming device...',
            'Verifying programming...',
            'Finalizing...'
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 500));
            this.addOutput(step);
        }
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: Open FPGA Loader Widget Successfully Created!');
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

}