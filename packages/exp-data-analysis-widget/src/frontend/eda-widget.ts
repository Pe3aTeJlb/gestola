import { inject, injectable, postConstruct } from 'inversify';
import { Message, Title, Widget } from '@theia/core/lib/browser';
import { ILogger, nls } from '@theia/core/lib/common';
import { EDAChartEditorWidget } from './eda-chart-editor-widget';
import { NavigatableDashboardEditorOptions, NavigatableDashboardEditorWidget } from '@gestola/dashboard-editor/lib/frontend/base/navigatable-dashboard-editor-widget';
import { DatasetSelectorWidget, TableSelectEvent } from '@gestola/dashboard-editor/lib/frontend/dataset-selector/dataset-selector-widget';
import { DataPreviewWidget } from '@gestola/dashboard-editor/lib/frontend/data-preview/data-preview-widget';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

@injectable()
export class EDAWidget extends NavigatableDashboardEditorWidget {

    static readonly ID = 'eda-editor:widget';
    static readonly LABEL = nls.localize("gestola/analytics/eda-widget-title", 'Gestola: Exploratory Data Analysis Widget');

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;

    @inject(FileService)
    readonly fileService: FileService;

    constructor(
        @inject(DatasetSelectorWidget)
        readonly datasetSelectorWidget: DatasetSelectorWidget,
        @inject(EDAChartEditorWidget)
        readonly chartEditor: EDAChartEditorWidget,
        @inject(DataPreviewWidget)
        override readonly dataPreviewWidget: DataPreviewWidget,
        @inject(ILogger) 
        override readonly logger: ILogger,
        @inject(NavigatableDashboardEditorOptions)
        override readonly options: NavigatableDashboardEditorOptions,
    ) {
        super(
            datasetSelectorWidget,
            chartEditor,
            dataPreviewWidget,
            logger,
            EDAWidget.ID,
            options
        );

        this.datasetSelectorWidget.onDidTableSelect(async (event: TableSelectEvent) => {
            this.dataPreviewWidget.setData(await this.projManager.getDatabaseService().getReportDataFor(event.table) as any);
            this.chartEditor.setDataset(event.table, await this.projManager.getDatabaseService().getReportDataFor(event.table, true) as any);
        });
        
    }

    @postConstruct()
    protected override init() {
        this.configureTitle(this.title);
    }
    
    protected override configureTitle(title: Title<Widget>): void {
       title.label = EDAWidget.LABEL;
       title.caption = EDAWidget.LABEL;
       title.closable = true;
    }

    protected override onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg);
    }

}