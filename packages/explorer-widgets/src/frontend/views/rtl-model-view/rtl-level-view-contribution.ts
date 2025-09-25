import { injectable, inject } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { Command } from "@theia/core";
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ProjectManager } from '@gestola/project-manager';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { RTL_LEVEL_VIEW_CONTAINER_ID, RTL_LEVEL_VIEW_MENU_LABEL } from './rtl-level-view-widget-factory';
import { ProjectExplorerWidget } from '../../widgets/project-explorer/project-explorer-widget';

export const RTL_LEVEL_VIEW_TOGGLE_COMMAND: Command = {
    id: "rtl-level:toggle",
    label: RTL_LEVEL_VIEW_MENU_LABEL
};

@injectable()
export class RTLLevelViewContribution extends AbstractViewContribution<ProjectExplorerWidget> implements FrontendApplicationContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;


    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
    ) {
        super({
            viewContainerId: RTL_LEVEL_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: RTL_LEVEL_VIEW_MENU_LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: RTL_LEVEL_VIEW_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

}