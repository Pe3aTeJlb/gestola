import { inject, injectable } from '@theia/core/shared/inversify';
import { CommonMenus, Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { ProjectManager } from '@gestola/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { MenuContribution, MenuModelRegistry, nls } from '@theia/core';
import { ProjectExplorerCommands } from './projec-explorer-commands';
import { ProjectExplorerWidget } from './project-explorer-widget';

@injectable()
export class ProjectExplorerCommandsContribution implements CommandContribution, TabBarToolbarContribution, MenuContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(ProjectExplorerCommands.CREATE_GESTOLA_PROJECT, {
            isEnabled: widget => this.withProjectExplorerWidget(widget, () => true),
            isVisible: widget => this.withProjectExplorerWidget(widget, () => true),
            execute: () =>  this.projManager.createProject()
        });

        commands.registerCommand(ProjectExplorerCommands.OPEN_GESTOLA_PROJECT, {
            isEnabled: widget => this.withProjectExplorerWidget(widget, () => true),
            isVisible: widget => this.withProjectExplorerWidget(widget, () => true),
            execute: () => this.projManager.openProject()
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: ProjectExplorerCommands.CREATE_GESTOLA_PROJECT.id,
            command: ProjectExplorerCommands.CREATE_GESTOLA_PROJECT.id,
            tooltip: nls.localize('gestola/project-manager/create-gestola-project', 'Create Gestola Project'),
            priority: 0,
        });

        registry.registerItem({
            id: ProjectExplorerCommands.OPEN_GESTOLA_PROJECT.id,
            command: ProjectExplorerCommands.OPEN_GESTOLA_PROJECT.id,
            tooltip: nls.localize('gestola/project-manager/open-gestola-project', 'Open Gestola Project'),
            priority: 1,
        });

    }

    registerMenus(menus: MenuModelRegistry): void {

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectExplorerCommands.CREATE_GESTOLA_PROJECT.id,
            label: ProjectExplorerCommands.CREATE_GESTOLA_PROJECT.label,
            order: 'a'
        });

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectExplorerCommands.OPEN_GESTOLA_PROJECT.id,
            label: ProjectExplorerCommands.OPEN_GESTOLA_PROJECT.label,
            order: 'a'
        });

    }
  
    protected withProjectExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: ProjectExplorerWidget) => T): T | false {
        if (widget instanceof ProjectExplorerWidget) {
            return cb(widget);
        }
        return false;
    }
  

}