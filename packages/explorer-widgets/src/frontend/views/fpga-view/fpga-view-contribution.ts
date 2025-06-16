import { injectable, inject } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { Command } from "@theia/core";
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID, TOPOLOGY_LEVEL_FPGA_VIEW_MENU_LABEL } from './fpga-view-widget-factory';
import { ProjectExplorerWidget } from '../../widgets/project-explorer/project-explorer-widget';

export const FPGA_VIEW_TOGGLE_COMMAND: Command = {
    id: "topology-level-fpga:toggle",
    label: TOPOLOGY_LEVEL_FPGA_VIEW_MENU_LABEL
};

@injectable()
export class TopologyLevelFPGAViewContribution extends AbstractViewContribution<ProjectExplorerWidget> implements FrontendApplicationContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;


    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
    ) {
        super({
            viewContainerId: TOPOLOGY_LEVEL_FPGA_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: TOPOLOGY_LEVEL_FPGA_VIEW_MENU_LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: FPGA_VIEW_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

}