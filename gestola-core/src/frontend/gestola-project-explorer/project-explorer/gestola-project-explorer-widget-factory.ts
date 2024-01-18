import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { WidgetWidget } from '../../widget-widget';
import { ProjectExplorerWidget } from './project-explorer-widget';
//import { FILE_NAVIGATOR_ID  } from '@theia/navigator/lib/browser/navigator-widget';

export const GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID = 'gestole-project-explorer-view-container';
export const GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola-core/gestola-project-explorer/gestola-project-explorer", "Gestola: Project Explorer"),
    iconClass: codicon('files'),
    closeable: true
};

@injectable()
export class GestolaProjectExplorerWidgetFactory implements WidgetFactory {

    static ID = GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID;

    readonly id = GestolaProjectExplorerWidgetFactory.ID;

    protected projectsNavigatorWidgetOptions: ViewContainer.Factory.WidgetOptions = {
        order: 1,
        canHide: false,
        initiallyCollapsed: false,
        weight: 80,
        disableDraggingToOtherContainers: true
    };
    protected projectsNavigatorWidgetOptions2: ViewContainer.Factory.WidgetOptions = {
        order: 2,
        canHide: false,
        initiallyCollapsed: false,
        weight: 80,
        disableDraggingToOtherContainers: true
    };

    @inject(ViewContainer.Factory)
    protected readonly viewContainerFactory: ViewContainer.Factory;
    
    @inject(WidgetManager) 
    protected readonly widgetManager: WidgetManager;

    async createWidget(): Promise<ViewContainer> {

        const viewContainer = this.viewContainerFactory({
            id: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
            progressLocationId: 'gestola-project-explorer-widget-factory'
        });
        viewContainer.setTitleOptions(GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS);

        const projectExplorerWidget = await this.widgetManager.getOrCreateWidget(ProjectExplorerWidget.ID);
        const reactTestWidget = await this.widgetManager.getOrCreateWidget(WidgetWidget.ID);

        viewContainer.addWidget(projectExplorerWidget, this.projectsNavigatorWidgetOptions);
        viewContainer.addWidget(reactTestWidget, this.projectsNavigatorWidgetOptions2);


        return viewContainer;
    }
}