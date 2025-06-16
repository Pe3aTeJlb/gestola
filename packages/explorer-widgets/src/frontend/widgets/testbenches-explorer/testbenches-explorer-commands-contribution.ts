import { inject, injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { MenuContribution, MenuModelRegistry, SelectionService, URI } from '@theia/core';
import { UriAwareCommandHandler, UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { TestbenchesExplorerCommands } from './testbenches-explorer-commands';
import { TestbenchesAddHandler } from '../../handlers/testbenches-add-handler';
import { TestbenchesRemoveHandler } from '../../handlers/testbenches-remove-handler';
import { TestbenchesExplorerWidget } from './testbenches-explorer-widget';

@injectable()
export class TestBenchesExplorerCommandsContribution implements CommandContribution, TabBarToolbarContribution, MenuContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(SelectionService) 
    protected readonly selectionService: SelectionService;

    @inject(TestbenchesAddHandler) 
    protected readonly testbenchesAddHandler: TestbenchesAddHandler;

    @inject(TestbenchesRemoveHandler) 
    protected readonly testbenchesRemoveHandler: TestbenchesRemoveHandler;

    protected newMultiUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]> {
        return UriAwareCommandHandler.MultiSelect(this.selectionService, handler);
    }

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(TestbenchesExplorerCommands.TESTBENCHES_ADD, this.newMultiUriAwareCommandHandler(this.testbenchesAddHandler));
        commands.registerCommand(TestbenchesExplorerCommands.TESTBENCHES_REMOVE, this.newMultiUriAwareCommandHandler(this.testbenchesRemoveHandler));

        commands.registerCommand(TestbenchesExplorerCommands.REFRESH_TESTBENCHES, {
            isEnabled: widget => this.withTestBenchesExplorerWidget(widget, () => true),
            isVisible: widget => this.withTestBenchesExplorerWidget(widget, () => true),
            execute: widget => this.withTestBenchesExplorerWidget(widget, (widget) => widget.model.refresh()),
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: TestbenchesExplorerCommands.REFRESH_TESTBENCHES.id,
            command: TestbenchesExplorerCommands.REFRESH_TESTBENCHES.id,
            tooltip: 'Refresh',
            priority: 1,
        });

    }

    registerMenus(menus: MenuModelRegistry): void {


    }
  
    protected withTestBenchesExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: TestbenchesExplorerWidget) => T): T | false {
        if (widget instanceof TestbenchesExplorerWidget) {
            return cb(widget);
        }
        return false;
    }
  

}