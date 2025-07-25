import { injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ModulesHieararchyCommands } from './database-explorer-commands';
import { DatabaseExplorerWidget } from './database-explorer-widget';

@injectable()
export class DatabaseExplorerCommandsContribution implements CommandContribution, TabBarToolbarContribution {

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(ModulesHieararchyCommands.REFRESH_DATABASE_EXPLORER, {
            isEnabled: widget => this.withModulesHierarchyWidget(widget, () => true),
            isVisible: widget => this.withModulesHierarchyWidget(widget, () => true),
            execute: widget => this.withModulesHierarchyWidget(widget, (widget) => widget.model.refresh()),
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: ModulesHieararchyCommands.REFRESH_DATABASE_EXPLORER.id,
            command: ModulesHieararchyCommands.REFRESH_DATABASE_EXPLORER.id,
            tooltip: 'Refresh',
            priority: 1,
        });

    }
  
    protected withModulesHierarchyWidget<T>(widget: Widget | undefined, cb: (navigator: DatabaseExplorerWidget) => T): T | false {
        if (widget instanceof DatabaseExplorerWidget) {
            return cb(widget);
        }
        return false;
    }
  

}