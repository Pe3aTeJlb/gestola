import { injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { DatasetSelectorCommands } from './dataset-selector-commands';
import { DatasetSelectorWidget } from './dataset-selector-widget';

@injectable()
export class DatasetSelectorCommandsContribution implements CommandContribution, TabBarToolbarContribution {

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(DatasetSelectorCommands.REFRESH_DATASET_SELECTOR, {
            isEnabled: widget => this.withModulesHierarchyWidget(widget, () => true),
            isVisible: widget => this.withModulesHierarchyWidget(widget, () => true),
            execute: widget => this.withModulesHierarchyWidget(widget, (widget) => widget.model.refresh()),
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: DatasetSelectorCommands.REFRESH_DATASET_SELECTOR.id,
            command: DatasetSelectorCommands.REFRESH_DATASET_SELECTOR.id,
            tooltip: 'Refresh',
            priority: 1,
        });

    }
  
    protected withModulesHierarchyWidget<T>(widget: Widget | undefined, cb: (navigator: DatasetSelectorWidget) => T): T | false {
        if (widget instanceof DatasetSelectorWidget) {
            return cb(widget);
        }
        return false;
    }
  

}