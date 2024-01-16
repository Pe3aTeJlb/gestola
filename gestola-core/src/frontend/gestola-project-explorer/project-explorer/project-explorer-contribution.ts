import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ProjectExplorerWidget } from './project-explorer-widget';
import { GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID } from './gestola-project-explorer-widget-factory';
import { Command, CommandRegistry, MenuModelRegistry, nls } from "@theia/core";
import { FrontendApplicationContribution } from '@theia/core/lib/browser';

export const PROJECT_EXPLORER_TOGGLE_COMMAND: Command = {
    id: "project-explorer:toggle",
    label: nls.localize("gestola-core/gestola-project-explorer/project-explorer", "Gestola Project Explorer")
};

@injectable()
export class ProjectExplorerViewContribution extends AbstractViewContribution<ProjectExplorerWidget> implements FrontendApplicationContribution {

    constructor() {
        super({
            viewContainerId: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: ProjectExplorerWidget.LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: PROJECT_EXPLORER_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }
  
    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(PROJECT_EXPLORER_TOGGLE_COMMAND, {
          execute: () => super.openView({ activate: false, reveal: true })
        });
      }
    
    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
    }

}