import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { ProjectExplorerWidget } from './project-explorer/project-explorer-widget';
import { GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions } from './file-explorer/file-navigator-widget';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { RTLModelExplorerWidget } from './rtl-model-explorer/rtl-model-explorer-widget';
import { ModuleHierarchyTreeWidget } from './module-hierarchy/module-hierarchy-widget';

export const GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID = 'gestole-project-explorer-view-container';
export const GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola/explorer/view-container-title", "Gestola: Projects Explorer"),
    iconClass: codicon('files'),
    closeable: true
};

@injectable()
export class GestolaProjectExplorerWidgetFactory implements WidgetFactory {

    @inject(ProjectManager) protected readonly projectManager: ProjectManager;

    static ID = GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID;

    readonly id = GestolaProjectExplorerWidgetFactory.ID;

    protected projectsNavigatorWidgetOptions1: ViewContainer.Factory.WidgetOptions = {
        order: 1,
        canHide: true,
        initiallyCollapsed: false,
        weight: 80,
        disableDraggingToOtherContainers: true
    };
     protected projectsNavigatorWidgetOptions2: ViewContainer.Factory.WidgetOptions = {
        order: 1,
        canHide: true,
        initiallyCollapsed: true,
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
        const rtlModelExplorerWidget = await this.widgetManager.getOrCreateWidget(RTLModelExplorerWidget.ID);

        const moduleHierarchyWidget = await this.widgetManager.getOrCreateWidget(ModuleHierarchyTreeWidget.ID);

        const systemFollderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-system"});
        const rtlFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-rtl"});
        const fpgaFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-fpga"});
        const topologyFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-topology"});
        const otherFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-other"});
        
        viewContainer.addWidget(projectExplorerWidget, this.projectsNavigatorWidgetOptions1);
        viewContainer.addWidget(rtlModelExplorerWidget, this.projectsNavigatorWidgetOptions1);

        viewContainer.addWidget(moduleHierarchyWidget, this.projectsNavigatorWidgetOptions1);

        viewContainer.addWidget(systemFollderFileNavigator, this.projectsNavigatorWidgetOptions2);
        viewContainer.addWidget(rtlFolderFileNavigator, this.projectsNavigatorWidgetOptions2);
        viewContainer.addWidget(fpgaFolderFileNavigator, this.projectsNavigatorWidgetOptions2);
        viewContainer.addWidget(topologyFolderFileNavigator, this.projectsNavigatorWidgetOptions2);
        viewContainer.addWidget(otherFolderFileNavigator, this.projectsNavigatorWidgetOptions2);

        viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));

        this.projectManager.onDidChangeProjectList(() => {
            viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));
        });

        return viewContainer;
    }

}