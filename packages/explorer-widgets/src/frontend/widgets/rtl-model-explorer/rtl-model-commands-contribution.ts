import { inject, injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { RTLModelExplorerCommands } from './rtl-model-explorer-commands';
import { RTLModelExplorerWidget } from './rtl-model-explorer-widget';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { nls } from '@theia/core';

@injectable()
export class RTLModelExplorerCommandsContribution implements CommandContribution, TabBarToolbarContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(RTLModelExplorerCommands.CREATE_RTL_MODEL, {
            isEnabled: widget => this.withRTLModelExplorerWidget(widget, () => true),
            isVisible: widget => this.withRTLModelExplorerWidget(widget, () => true),
            execute: () => this.projManager.createRTLModel()
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: RTLModelExplorerCommands.CREATE_RTL_MODEL.id,
            command: RTLModelExplorerCommands.CREATE_RTL_MODEL.id,
            tooltip: nls.localize('gestola/project-manager/create-rtl-model', 'Create RTL Model'),
            priority: 0,
        });

    }
  
    protected withRTLModelExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: RTLModelExplorerWidget) => T): T | false {
        if (widget instanceof RTLModelExplorerWidget) {
            return cb(widget);
        }
        return false;
    }
  

}