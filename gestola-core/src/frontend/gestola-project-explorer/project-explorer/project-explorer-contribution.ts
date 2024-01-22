import { injectable, inject } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ProjectExplorerWidget } from './project-explorer-widget';
import { GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID } from '../gestola-project-explorer-widget-factory';
import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, nls } from "@theia/core";
import { CommonMenus, FrontendApplicationContribution, Widget } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ProjectManagerCommands } from '../../project-manager/project-manager-commands';
import { ProjectManager } from '../../project-manager/project-manager';

export const PROJECT_EXPLORER_TOGGLE_COMMAND: Command = {
    id: "project-explorer:toggle",
    label: ProjectExplorerWidget.MENU_LABEL
};

@injectable()
export class ProjectExplorerViewContribution extends AbstractViewContribution<ProjectExplorerWidget> implements FrontendApplicationContribution, TabBarToolbarContribution, CommandContribution, MenuContribution {

    constructor(@inject(ProjectManager) private readonly projManager: ProjectManager) {
        super({
            viewContainerId: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: ProjectExplorerWidget.MENU_LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: PROJECT_EXPLORER_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

    protected withWidget(
        widget: Widget | undefined = this.tryGetWidget(),
        predicate: (output: ProjectExplorerWidget) => boolean = () => true
    ): boolean | false {
        return widget instanceof ProjectExplorerWidget ? predicate(widget) : false;
    }

  
    registerCommands(commands: CommandRegistry): void {
        
        commands.registerCommand(PROJECT_EXPLORER_TOGGLE_COMMAND, {
          execute: () => super.openView({ activate: false, reveal: true })
        });

        commands.registerCommand(ProjectManagerCommands.CREATE_GESTOLA_PROJECT, {
            isEnabled: widget => this.withWidget(widget, () => true),
            isVisible: widget => this.withWidget(widget, () => true),
            execute: () => this.projManager.createProject()
        });

        commands.registerCommand(ProjectManagerCommands.OPEN_GESTOLA_PROJECT, {
            isEnabled: widget => this.withWidget(widget, () => true),
            isVisible: widget => this.withWidget(widget, () => true),
            execute: () => this.projManager.openProject()
        });

      }
    
    registerMenus(menus: MenuModelRegistry): void {

        super.registerMenus(menus);

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            order: 'a'
        });

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            order: 'a'
        });

    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
       
        registry.registerItem({
            id: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            command: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            tooltip: nls.localize('gestola-core/project-manager/create-gestola-project', 'Create Gestola Project'),
            priority: 0,
        });

        registry.registerItem({
            id: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            command: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            tooltip: nls.localize('gestola-core/project-manager/open-gestola-project', 'Open Gestola Project'),
            priority: 1,
        });

    }

}