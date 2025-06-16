import { inject, injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ModuleHierarchyTreeWidget } from './module-hierarchy-widget';
import { ModulesHieararchyCommands } from './module-hierarchy-commands';

@injectable()
export class ModuleHierarchyCommandsContribution implements CommandContribution, TabBarToolbarContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(ModulesHieararchyCommands.REFRESH_MODULES_HIERARCHY, {
            isEnabled: widget => this.withModulesHierarchyWidget(widget, () => true),
            isVisible: widget => this.withModulesHierarchyWidget(widget, () => true),
            execute: widget => this.withModulesHierarchyWidget(widget, (widget) => widget.model.refresh()),
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: ModulesHieararchyCommands.REFRESH_MODULES_HIERARCHY.id,
            command: ModulesHieararchyCommands.REFRESH_MODULES_HIERARCHY.id,
            tooltip: 'Refresh',
            priority: 1,
        });

    }
  
    protected withModulesHierarchyWidget<T>(widget: Widget | undefined, cb: (navigator: ModuleHierarchyTreeWidget) => T): T | false {
        if (widget instanceof ModuleHierarchyTreeWidget) {
            return cb(widget);
        }
        return false;
    }
  

}