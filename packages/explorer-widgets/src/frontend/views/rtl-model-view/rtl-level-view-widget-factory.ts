import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { ModuleHierarchyTreeWidget } from '../../widgets/module-hierarchy/module-hierarchy-widget';
import { TestBenchExplorerWidget } from '../../widgets/testbenches-explorer/testbenches-explorer-widget';
import { GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions } from '../../widgets/file-explorer/file-navigator-widget';

export const RTL_LEVEL_VIEW_CONTAINER_ID = 'gestola.rtl-level.view-container';
export const RTL_LEVEL_VIEW_MENU_LABEL = nls.localize("gestola/rtl-level/view-container-title", "Gestola: RTL Level")
export const RTL_LEVEL_VIEW_LABEL = nls.localize("gestola/rtl-level/project-explorer-view-title", "Gestola: RTL Level");
export const RTL_LEVEL_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola/rtl-level/view-container-title", "RTL Level"),
    iconClass: codicon('files'),
    closeable: true
};

@injectable()
export class RTLLevelWidgetFactory implements WidgetFactory {

    @inject(ProjectManager) protected readonly projectManager: ProjectManager;

    static ID = RTL_LEVEL_VIEW_CONTAINER_ID;

    readonly id = RTLLevelWidgetFactory.ID;

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
            id: RTL_LEVEL_VIEW_CONTAINER_ID,
            progressLocationId: 'gestola.rtl-level-widget-factory'
        });
        viewContainer.setTitleOptions(RTL_LEVEL_VIEW_CONTAINER_TITLE_OPTIONS);
    
        const rtlFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-rtl", viewContainerID: RTL_LEVEL_VIEW_CONTAINER_ID});

        const moduleHierarchyWidget = await this.widgetManager.getOrCreateWidget(ModuleHierarchyTreeWidget.ID);
        const simResultsFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "simresults", viewContainerID: RTL_LEVEL_VIEW_CONTAINER_ID});
        const testbenchesExplorerWidget = await this.widgetManager.getOrCreateWidget(TestBenchExplorerWidget.ID);
        const miscFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-misc", viewContainerID: RTL_LEVEL_VIEW_CONTAINER_ID});

        viewContainer.addWidget(moduleHierarchyWidget, this.widgetOptions);
        viewContainer.addWidget(testbenchesExplorerWidget, this.widgetOptions);
        viewContainer.addWidget(simResultsFileNavigator, this.widgetOptions);
        viewContainer.addWidget(rtlFolderFileNavigator, this.widgetOptions);
        viewContainer.addWidget(miscFolderFileNavigator, this.widgetOptions);

        viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));

        this.projectManager.onDidChangeProjectList(() => {
            viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));
        });

        return viewContainer;
    }

}