import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { ProjectExplorerWidget } from './project-explorer/project-explorer-widget';
import { GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions } from './file-explorer/file-navigator-widget';

export const GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID = 'gestole-project-explorer-view-container';
export const GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola-core/gestola-project-explorer/view-container-title", "Gestola: Projects Explorer"),
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
        const systemModelFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-system-model"});
        const rtlModelFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-rtl-model"});
        const topologyModelFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-topology-model"});
        const otherFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-otherFiles"});
       
        viewContainer.addWidget(projectExplorerWidget, this.projectsNavigatorWidgetOptions);
        viewContainer.addWidget(systemModelFileNavigator, this.projectsNavigatorWidgetOptions);
        viewContainer.addWidget(rtlModelFileNavigator, this.projectsNavigatorWidgetOptions);
        viewContainer.addWidget(topologyModelFileNavigator, this.projectsNavigatorWidgetOptions);
        viewContainer.addWidget(otherFileNavigator, this.projectsNavigatorWidgetOptions);

        return viewContainer;
    }
}