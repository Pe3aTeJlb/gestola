import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions } from '../../widgets/file-explorer/file-navigator-widget';
import { ConstrainsExplorerWidget } from '../../widgets/constrains-explorer/constrains-explorer-widget';

export const TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID = 'gestola.topology-level-fpga.view-container';
export const TOPOLOGY_LEVEL_FPGA_VIEW_MENU_LABEL = nls.localize("gestola/topology-level-fpga/view-container-title", "Gestola: Topology Level - FPGA")
export const TOPOLOGY_LEVEL_FPGA_VIEW_LABEL = nls.localize("gestola/topology-level-fpga/project-explorer-view-title", "Gestola: Topology Level - FPGA");
export const TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola/topology-level-fpga/view-container-title", "Topology Level - FPGA"),
    iconClass: codicon('files'),
    closeable: true
};

@injectable()
export class TopologyLevelFPGAWidgetFactory implements WidgetFactory {

    @inject(ProjectManager) protected readonly projectManager: ProjectManager;

    static ID = TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID;

    readonly id = TopologyLevelFPGAWidgetFactory.ID;

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
            id: TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID,
            progressLocationId: 'gestola.fpga-widget-factory'
        });
        viewContainer.setTitleOptions(TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_TITLE_OPTIONS);

        const constrainsExplorer = await this.widgetManager.getOrCreateWidget(ConstrainsExplorerWidget.ID);
    
        const synthResultsFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-fpga-synth-results", viewContainerID: TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID});
        const implResultsFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-fpga-impl-results", viewContainerID: TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID});
        const miscFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-misc", viewContainerID: TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID});

        viewContainer.addWidget(constrainsExplorer, this.widgetOptions);
        viewContainer.addWidget(synthResultsFolderFileNavigator, this.widgetOptions);
        viewContainer.addWidget(implResultsFolderFileNavigator, this.widgetOptions);
        viewContainer.addWidget(miscFolderFileNavigator, this.widgetOptions);

        viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));

        this.projectManager.onDidChangeProjectList(() => {
            viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));
        });

        return viewContainer;
    }

}