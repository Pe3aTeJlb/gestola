import { inject, injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { MenuContribution, MenuModelRegistry, MenuPath, SelectionService, URI } from '@theia/core';
import { UriAwareCommandHandler, UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { ConstrainsExplorerCommands } from './constrains-explorer-commands';
import { TestbenchesAddHandler } from '../../handlers/testbenches-add-handler';
import { TestbenchesRemoveHandler } from '../../handlers/testbenches-remove-handler';
import { TestbenchTreeNode } from './constrains-explorer-tree-impl';
import { ConstrainsExplorerWidget } from './constrains-explorer-widget';
import { VerilatorFrontendService } from '@gestola/verilator-wrapper/lib/frontend/verilator-service';

export const TESTBENCHES_EXPLORER_CONTEXT_MENU: MenuPath = ['testbenches-explorer-context-menu'];

@injectable()
export class ConstrainsExplorerCommandsContribution implements CommandContribution, TabBarToolbarContribution, MenuContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(VerilatorFrontendService)
    protected readonly verilatorService: VerilatorFrontendService;

    @inject(SelectionService) 
    protected readonly selectionService: SelectionService;

    @inject(TestbenchesAddHandler) 
    protected readonly testbenchesAddHandler: TestbenchesAddHandler;

    @inject(TestbenchesRemoveHandler) 
    protected readonly testbenchesRemoveHandler: TestbenchesRemoveHandler;

    protected newUriAwareCommandHandler(handler: UriCommandHandler<URI>): UriAwareCommandHandler<URI> {
        return UriAwareCommandHandler.MonoSelect(this.selectionService, handler);
    }

    protected newMultiUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]> {
        return UriAwareCommandHandler.MultiSelect(this.selectionService, handler);
    }

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(ConstrainsExplorerCommands.TESTBENCHES_ADD_BY_URI, this.newUriAwareCommandHandler(this.testbenchesAddHandler));
        commands.registerCommand(ConstrainsExplorerCommands.TESTBENCHES_REMOVE_BY_URI, this.newMultiUriAwareCommandHandler(this.testbenchesRemoveHandler));

        commands.registerCommand(ConstrainsExplorerCommands.TESTBENCHES_REMOVE, {
            isEnabled: widget => this.withTestBenchesExplorerWidget(widget, (widget) => widget.model.selectedNodes.length > 0),
            isVisible: widget => true,
            execute:  widget => this.projManager.removeTestBenchByHDLModuleRef(widget.model.selectedNodes.map((i:TestbenchTreeNode) => i.module)),
        });



        commands.registerCommand(ConstrainsExplorerCommands.TESTBENCHES_RUN_SIMULATION_SELECTED, {
            isEnabled: widget => this.withTestBenchesExplorerWidget(widget, (widget) => widget.model.selectedNodes.length > 0),
            isVisible: widget => true,
            execute: (widget: ConstrainsExplorerWidget) => this.verilatorService.runMultiple(widget.model.selectedNodes.map((e: TestbenchTreeNode) => e.module)),
        });

        commands.registerCommand(ConstrainsExplorerCommands.TESTBENCHES_RUN_SIMULATION_ALL, {
            isEnabled: widget => { let model = this.projManager.getCurrRTLModel();
                return !!model && model.testbenchesFiles.length > 0;
            },
            isVisible: widget => this.withTestBenchesExplorerWidget(widget, () => true),
            execute: (widget: ConstrainsExplorerWidget) => this.verilatorService.runMultiple(this.projManager.getCurrRTLModel()!.testbenchesFiles),
        });



        commands.registerCommand(ConstrainsExplorerCommands.REFRESH_TESTBENCHES, {
            isEnabled: widget => this.withTestBenchesExplorerWidget(widget, () => true),
            isVisible: widget => this.withTestBenchesExplorerWidget(widget, () => true),
            execute: widget => widget.model.refresh(),
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: ConstrainsExplorerCommands.REFRESH_TESTBENCHES.id,
            command: ConstrainsExplorerCommands.REFRESH_TESTBENCHES.id,
            tooltip: 'Refresh',
            priority: 1,
        });

        registry.registerItem({
            id: ConstrainsExplorerCommands.TESTBENCHES_RUN_SIMULATION_ALL.id,
            command: ConstrainsExplorerCommands.TESTBENCHES_RUN_SIMULATION_ALL.id,
            tooltip: 'Run All',
            priority: 1,
        });

    }

    registerMenus(menus: MenuModelRegistry): void {

        menus.registerMenuAction(TESTBENCHES_EXPLORER_CONTEXT_MENU, {
            commandId: ConstrainsExplorerCommands.TESTBENCHES_RUN_SIMULATION_SELECTED.id,
            order: '1'
        });

        menus.registerMenuAction(TESTBENCHES_EXPLORER_CONTEXT_MENU, {
            commandId: ConstrainsExplorerCommands.TESTBENCHES_REMOVE.id,
            order: '2'
        });

    }
  
    protected withTestBenchesExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: ConstrainsExplorerWidget) => T): T | false {
        if (widget instanceof ConstrainsExplorerWidget) {
            return cb(widget);
        }
        return false;
    }
  

}