import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions } from '../../widgets/file-explorer/file-navigator-widget';

export const TOPOLOGY_LEVEL_VLSI_VIEW_CONTAINER_ID = 'gestole-topology-level-vlsi-view-container';
export const TOPOLOGY_LEVEL_VLSI_VIEW_MENU_LABEL = nls.localize("gestola/topology-level-vlsi/view-container-title", "Gestola: Topology Level - VLSI")
export const TOPOLOGY_LEVEL_VLSI_VIEW_LABEL = nls.localize("gestola/topology-level-vlsi/project-explorer-view-title", "Gestola: Topology Level - VLSI");
export const TOPOLOGY_LEVEL_VLSI_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola/topology-level-vlsi/view-container-title", "Topology Level - VLSI"),
    iconClass: codicon('files'),
    closeable: true
};

@injectable()
export class TopologyLevelVLSIWidgetFactory implements WidgetFactory {

    @inject(ProjectManager) protected readonly projectManager: ProjectManager;

    static ID = TOPOLOGY_LEVEL_VLSI_VIEW_CONTAINER_ID;

    readonly id = TopologyLevelVLSIWidgetFactory.ID;

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
            id: TOPOLOGY_LEVEL_VLSI_VIEW_CONTAINER_ID,
            progressLocationId: 'gestola-topology-level-vlsi-widget-factory'
        });
        viewContainer.setTitleOptions(TOPOLOGY_LEVEL_VLSI_VIEW_CONTAINER_TITLE_OPTIONS);
    
        const vlsiFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-vlsi", viewContainerID: TOPOLOGY_LEVEL_VLSI_VIEW_CONTAINER_ID});
        const miscFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-misc", viewContainerID: TOPOLOGY_LEVEL_VLSI_VIEW_CONTAINER_ID});

        viewContainer.addWidget(vlsiFolderFileNavigator, this.widgetOptions);
        viewContainer.addWidget(miscFolderFileNavigator, this.widgetOptions);

        viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));

        this.projectManager.onDidChangeProjectList(() => {
            viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));
        });

        return viewContainer;
    }

}