import { inject, injectable, postConstruct } from 'inversify';
import { Message, Title, Widget } from '@theia/core/lib/browser';
import { ILogger } from '@theia/core/lib/common';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { NavigatableDashboardEditorOptions, NavigatableDashboardEditorWidget } from './base/navigatable-dashboard-editor-widget';
import { DatasetSelectorWidget, TableSelectEvent } from './dataset-selector/dataset-selector-widget';
import { ChartEditorWidget } from './chart-editor/react-chart-editor-widget';
import { DataPreviewWidget } from './data-preview/data-preview-widget';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';

@injectable()
export class DashboardEditorWidget extends NavigatableDashboardEditorWidget {

    static readonly ID = 'dashboard-editor:widget';
    static readonly LABEL = 'Gestola: Dashboard Editor Widget';

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;

    @inject(FileService)
    readonly fileService: FileService;

    constructor(
        @inject(DatasetSelectorWidget)
        readonly datasetSelectorWidget: DatasetSelectorWidget,
        @inject(ChartEditorWidget)
        readonly chartEditor: ChartEditorWidget,
        @inject(DataPreviewWidget)
        override readonly dataPreviewWidget: DataPreviewWidget,
        @inject(ILogger) 
        override readonly logger: ILogger,
        @inject(NavigatableDashboardEditorOptions)
        protected override readonly options: NavigatableDashboardEditorOptions,
    ) {
        super(
            datasetSelectorWidget,
            chartEditor,
            dataPreviewWidget,
            logger,
            DashboardEditorWidget.ID,
            options
        );

        this.datasetSelectorWidget.onDidTableSelect(async (event: TableSelectEvent) => {
            const sampleData: Object[] = await this.projManager.getDatabaseService().getReportSampleDataFor(event.table);
            this.dataPreviewWidget.setData(sampleData);
            this.chartEditor.setDataset(event.table, sampleData);
        });
        
    }

    @postConstruct()
    protected override init() {
        this.configureTitle(this.title);
    }

    protected getTypeProperty(): string {
        return 'typeId';
    }

    protected override configureTitle(title: Title<Widget>): void {
       if(this.options.uri){
        title.label = this.options.uri.path.base;
        title.caption = this.options.uri.toString();
       } else {
        title.label = DashboardEditorWidget.LABEL;
        title.caption = DashboardEditorWidget.LABEL;
       }
       title.closable = true;
    }

    protected override onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
    }

}