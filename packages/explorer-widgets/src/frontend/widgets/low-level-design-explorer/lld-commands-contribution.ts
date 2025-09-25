import { inject, injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { LLDExplorerCommands } from './lld-explorer-commands';
import { LLDExplorerWidget } from './lld-explorer-widget';
import { ProjectManager } from '@gestola/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { nls } from '@theia/core';

@injectable()
export class LLDExplorerCommandsContribution implements CommandContribution, TabBarToolbarContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(LLDExplorerCommands.CREATE_LLD, {
            isEnabled: widget => this.withRTLModelExplorerWidget(widget, () => true),
            isVisible: widget => this.withRTLModelExplorerWidget(widget, () => true),
            execute: () => this.projManager.createLowLevelDesign()
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: LLDExplorerCommands.CREATE_LLD.id,
            command: LLDExplorerCommands.CREATE_LLD.id,
            tooltip: nls.localize('gestola/project-manager/create-low-level-design', 'Create Low Level Design'),
            priority: 0,
        });

    }
  
    protected withRTLModelExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: LLDExplorerWidget) => T): T | false {
        if (widget instanceof LLDExplorerWidget) {
            return cb(widget);
        }
        return false;
    }
  

}