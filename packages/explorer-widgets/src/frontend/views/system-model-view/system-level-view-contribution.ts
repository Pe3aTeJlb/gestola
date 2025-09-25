import { injectable, inject } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { Command } from "@theia/core";
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ProjectManager } from '@gestola/project-manager';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { SYSTEM_LEVEL_VIEW_CONTAINER_ID, SYSTEM_LEVEL_VIEW_MENU_LABEL } from './system-level-view-widget-factory';
import { ProjectExplorerWidget } from '../../widgets/project-explorer/project-explorer-widget';

export const SYSTEM_LEVEL_VIEW_TOGGLE_COMMAND: Command = {
    id: "system-level:toggle",
    label: SYSTEM_LEVEL_VIEW_MENU_LABEL
};

@injectable()
export class SystemLevelViewContribution extends AbstractViewContribution<ProjectExplorerWidget> implements FrontendApplicationContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;


    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
    ) {
        super({
            viewContainerId: SYSTEM_LEVEL_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: SYSTEM_LEVEL_VIEW_MENU_LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: SYSTEM_LEVEL_VIEW_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

}