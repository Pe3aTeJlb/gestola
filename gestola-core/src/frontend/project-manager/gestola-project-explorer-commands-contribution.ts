import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { CommonMenus } from '@theia/core/lib/browser';
import { ProjectManager } from './project-manager';
import { ProjectManagerCommands } from './project-manager-commands';

@injectable()
export class ProjectExplorerCommandContribution implements CommandContribution {

    constructor(
        @inject(ProjectManager) private readonly projManager: ProjectManager,
    ) { }

    registerCommands(registry: CommandRegistry): void {

        registry.registerCommand(ProjectManagerCommands.CREATE_GESTOLA_PROJECT, {
            execute: () => this.projManager.createProject()
        });

        registry.registerCommand(ProjectManagerCommands.OPEN_GESTOLA_PROJECT, {
            execute: () => this.projManager.openProject()
        });

    }
}

@injectable()
export class ProjectExplorerMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            order: 'a'
        });

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            order: 'a'
        });

    }

}