import { inject, injectable, postConstruct } from 'inversify';
import { Title, Widget } from '@theia/core/lib/browser';
import { NavigatableWaveformViewerOptions, NavigatableTreeEditorWidget } from "../tree-editor-widget/navigatable-waveform-viewer-widget";
import { NetlistTreeWidget } from "./netlist-tree-widget";
import { WaveformWidget } from './waveform-widget';
import { ILogger } from '@theia/core/lib/common';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WaveformViewerBackendService } from '../../common/protocol';
import { IWaveformDumpDoc, MetadataPackage, TransactionPackage } from '../../common/waveform-doc-dto';
import { DocumentWatcher } from '../../common/document-watcher';
import { waitForRevealed } from '@theia/core/lib/browser';

@injectable()
export class WaveformViewerWidget extends NavigatableTreeEditorWidget {

    static readonly ID = 'waveform-viewer:widget';
    static readonly LABEL = 'Gestola: Waveform Viewer';

    constructor(
        @inject(NetlistTreeWidget)
        readonly netlistWidget: NetlistTreeWidget,
        @inject(WaveformWidget)
        override readonly waveformWidget: WaveformWidget,
        @inject(FileService)
        readonly fileService: FileService,
        @inject(ILogger) 
        override readonly logger: ILogger,
        @inject(NavigatableWaveformViewerOptions)
        protected override readonly options: NavigatableWaveformViewerOptions,
        @inject(DocumentWatcher) 
        readonly documentWatcher: DocumentWatcher,
        @inject(WaveformViewerBackendService)
        readonly waveformViewerBackendService: WaveformViewerBackendService
    ) {
        super(
            netlistWidget,
            waveformWidget,
            logger,
            WaveformViewerWidget.ID,
            options
        );

        this.documentWatcher.onTransactionReceived((event: TransactionPackage) => {
            console.log('chunk received for', options.uri.path.fsPath(), event.uri.isEqual(options.uri));
            if(event.uri.isEqual(options.uri)){
                this.waveformWidget.updateWaveformChunk(event);
            }
        });

        this.documentWatcher.onMetadataReceived((event: MetadataPackage) => {
            console.log('meta received for', options.uri.path.fsPath(), event.uri.isEqual(options.uri));
            if(event.uri.isEqual(options.uri)){
                this.waveformWidget.setMetadata(event.metadata);
            }
        });

        waitForRevealed(this).then(async () => {
            await this.waveformWidget.configure();
            await this.configure();
        });
        
    }

    @postConstruct()
    protected override init() {
        this.configureTitle(this.title);
    }

    protected async configure(){
        console.log('configuring widget object');
        let doc: IWaveformDumpDoc = await this.waveformViewerBackendService.load(this.options.uri);
        this.netlistWidget.setData(doc.netlistTree);
        this.waveformWidget.setData(doc);
    }

    protected getTypeProperty(): string {
        return 'typeId';
    }

    protected override configureTitle(title: Title<Widget>): void {
        super.configureTitle(title);
        //title.iconClass = "waveform-file";
    }

    override dispose(): void {
        
    }

}