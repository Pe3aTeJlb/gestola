import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { DatabaseExplorerWidget } from '../../widgets/database-explorer/database-explorer-widget';

export const ANALYTICS_VIEW_CONTAINER_ID = 'gestola.analytics-view.view-container';
export const ANALYTICS_VIEW_MENU_LABEL = nls.localize("gestola/analytics-view/view-container-title", "Gestola: Analytics Module")
export const ANALYTICS_VIEW_LABEL = nls.localize("gestola/analytics-view/project-explorer-view-title", "Gestola: Analytics Module");
export const ANALYTICS_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola/analytics-view/view-container-title", "Analytics Module"),
    iconClass: codicon('graph-line'),
    closeable: true
};

@injectable()
export class AnalyticsWidgetFactory implements WidgetFactory {

    @inject(ProjectManager) protected readonly projectManager: ProjectManager;

    static ID = ANALYTICS_VIEW_CONTAINER_ID;

    readonly id = AnalyticsWidgetFactory.ID;

    protected widgetOptions: ViewContainer.Factory.WidgetOptions = {
        order: 1,
        canHide: true,
        initiallyCollapsed: false,
        weight: 80,
        disableDraggingToOtherContainers: false
    };

    @inject(ViewContainer.Factory)
    protected readonly viewContainerFactory: ViewContainer.Factory;
    
    @inject(WidgetManager) 
    protected readonly widgetManager: WidgetManager;

    async createWidget(): Promise<ViewContainer> {

        const viewContainer = this.viewContainerFactory({
            id: ANALYTICS_VIEW_CONTAINER_ID,
            progressLocationId: 'gestola.analytics-widget-factory'
        });
        viewContainer.setTitleOptions(ANALYTICS_VIEW_CONTAINER_TITLE_OPTIONS);

        const databaseExploerer = await this.widgetManager.getOrCreateWidget(DatabaseExplorerWidget.ID);

        viewContainer.addWidget(databaseExploerer, this.widgetOptions);

        viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));

        this.projectManager.onDidChangeProjectList(() => {
            viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));
        });

        return viewContainer;
    }

}