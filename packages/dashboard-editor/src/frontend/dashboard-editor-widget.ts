import { inject, injectable, postConstruct } from 'inversify';
import { Message, Title, Widget } from '@theia/core/lib/browser';
import { ILogger } from '@theia/core/lib/common';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { NavigatableDashboardEditorWidget } from './base/navigatable-waveform-viewer-widget';
import { DatabaseExplorerWidget } from './database-explorer/database-explorer-widget';
import { ChartEditorWidget } from './chart-editor/react-chart-editor-widget';
import { DataPreviewWidget } from './data-preview/data-preview-widget';

@injectable()
export class DashboardEditorWidget extends NavigatableDashboardEditorWidget {

    static readonly ID = 'dashboard-widget-editor:widget';
    static readonly LABEL = 'Gestola: Dashboard Wdiget Editor';

    @inject(FileService)
    readonly fileService: FileService;

    constructor(
        @inject(DatabaseExplorerWidget)
        readonly databaseExplorerWidget: DatabaseExplorerWidget,
        @inject(ChartEditorWidget)
        readonly chartEditor: ChartEditorWidget,
        @inject(DataPreviewWidget)
        override readonly dataPreviewWidget: DataPreviewWidget,
        @inject(ILogger) 
        override readonly logger: ILogger,
        @inject(NavigatableDashboardEditorWidget)
        protected override readonly options: NavigatableDashboardEditorWidget,
    ) {
        super(
            databaseExplorerWidget,
            chartEditor,
            dataPreviewWidget,
            logger,
            DashboardEditorWidget.ID,
            options
        );

        
    }

    @postConstruct()
    protected override init() {
        this.configureTitle(this.title);
        this.configure();
    }

    protected async configure(){

    }

    protected getTypeProperty(): string {
        return 'typeId';
    }

    protected override configureTitle(title: Title<Widget>): void {
        super.configureTitle(title);
        //title.iconClass = "waveform-file";
    }

    protected override onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
    }

}