import { inject, injectable } from '@theia/core/shared/inversify';
import { CompositeTreeNode, KeybindingContribution, KeybindingRegistry, SelectableTreeNode, Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { ProjectManager } from '@gestola/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { UriAwareCommandHandler, UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { MenuContribution, MenuModelRegistry, MenuPath, SelectionService, URI, isOSX, nls } from '@theia/core';
import { FileNavigatorCommands } from './file-navigator-commands';
import { RTLModelFilesIncludeHandler } from '../../handlers/rtl-model-include-handler';
import { RTLModelFilesExcludeHandler } from '../../handlers/rtl-model-exclude-handler';
import { RTLModelSetTopModuleHandler } from '../../handlers/rtl-model-set-top-handler';
import { GestolaFileNavigatorWidget } from './file-navigator-widget';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { TestbenchesExplorerCommands } from '../testbenches-explorer/testbenches-explorer-commands';
import { FileNavigatorCommands as fnc } from '@theia/navigator/lib/browser/file-navigator-commands';

export const NAVIGATOR_CONTEXT_MENU: MenuPath = ['navigator-context-menu'];
export const MODIFICATION = [...NAVIGATOR_CONTEXT_MENU, '7_modification'];

@injectable()
export class FileNavigatorCommandsContribution implements CommandContribution, TabBarToolbarContribution, MenuContribution, KeybindingContribution {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(SelectionService) 
    protected readonly selectionService: SelectionService;

    @inject(RTLModelFilesIncludeHandler) 
    protected readonly rtlModelFilesIncludeHandler: RTLModelFilesIncludeHandler;

    @inject(RTLModelFilesExcludeHandler) 
    protected readonly rtlModelFilesExcludeHandler: RTLModelFilesExcludeHandler;

    @inject(RTLModelSetTopModuleHandler) 
    protected readonly rtlModelSetTopModuleHandler: RTLModelSetTopModuleHandler;


    protected newUriAwareCommandHandler(handler: UriCommandHandler<URI>): UriAwareCommandHandler<URI> {
        return UriAwareCommandHandler.MonoSelect(this.selectionService, handler);
    }

    protected newMultiUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]> {
        return UriAwareCommandHandler.MultiSelect(this.selectionService, handler);
    }

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(FileNavigatorCommands.DESIGN_FILES_INCLUDE, this.newMultiUriAwareCommandHandler(this.rtlModelFilesIncludeHandler));
        commands.registerCommand(FileNavigatorCommands.DESIGN_FILES_EXCLUDE, this.newMultiUriAwareCommandHandler(this.rtlModelFilesExcludeHandler));
        commands.registerCommand(FileNavigatorCommands.DESIGN_SET_TOP_MODULE, this.newUriAwareCommandHandler(this.rtlModelSetTopModuleHandler));

        commands.registerCommand(FileNavigatorCommands.COLLAPSE_ALL, {
            execute: widget => this.withFileNavigatorWidget(widget, (widget) => this.collapseFileNavigatorTree(widget)),
            isEnabled: widget => this.withFileNavigatorWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withFileNavigatorWidget(widget, () => true)
        });

        commands.registerCommand(FileNavigatorCommands.REFRESH_NAVIGATOR, {
            execute: widget => this.withFileNavigatorWidget(widget, (widget) => widget.model.refresh()),
            isEnabled: widget => this.withFileNavigatorWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withFileNavigatorWidget(widget, () => true)
        });

        commands.registerCommand(FileNavigatorCommands.NEW_FILE_TOOLBAR, {
            execute: (...args) => {
                if(args[0] instanceof GestolaFileNavigatorWidget){
                    if((<GestolaFileNavigatorWidget> args[0]).model.getFocusedNode()){
                        commands.executeCommand(WorkspaceCommands.NEW_FILE.id, ...args);
                    } else {
                        commands.executeCommand(WorkspaceCommands.NEW_FILE.id, args[0].model.rootURI);
                    }   
                }
            },
            isEnabled: widget => this.withFileNavigatorWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withFileNavigatorWidget(widget, () => true)
        });

        commands.registerCommand(FileNavigatorCommands.NEW_FOLDER_TOOLBAR, {
            execute: (...args) => {
                if(args[0] instanceof GestolaFileNavigatorWidget){
                    if((<GestolaFileNavigatorWidget> args[0]).model.getFocusedNode()){
                        commands.executeCommand(WorkspaceCommands.NEW_FOLDER.id, ...args);
                    } else {
                        commands.executeCommand(WorkspaceCommands.NEW_FOLDER.id, args[0].model.rootURI);
                    }   
                }
            },
            isEnabled: widget => this.withFileNavigatorWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: (widget => this.withFileNavigatorWidget(widget, () => true))
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: FileNavigatorCommands.NEW_FILE_TOOLBAR.id,
            command: FileNavigatorCommands.NEW_FILE_TOOLBAR.id,
            tooltip: nls.localizeByDefault('New File...'),
            priority: 0,
        });

        registry.registerItem({
            id: FileNavigatorCommands.NEW_FOLDER_TOOLBAR.id,
            command: FileNavigatorCommands.NEW_FOLDER_TOOLBAR.id,
            tooltip: nls.localizeByDefault('New Folder...'),
            priority: 1,
        });

        registry.registerItem({
            id: FileNavigatorCommands.REFRESH_NAVIGATOR.id,
            command: FileNavigatorCommands.REFRESH_NAVIGATOR.id,
            tooltip: nls.localizeByDefault('Refresh Explorer'),
            priority: 2,
        });

        registry.registerItem({
            id: FileNavigatorCommands.COLLAPSE_ALL.id,
            command: FileNavigatorCommands.COLLAPSE_ALL.id,
            tooltip: nls.localizeByDefault('Collapse All'),
            priority: 3,
        });
     
    }

    registerMenus(menus: MenuModelRegistry): void {

        menus.registerMenuAction(MODIFICATION, {
            commandId: FileNavigatorCommands.DESIGN_SET_TOP_MODULE.id,
            order: 'b'
        });

        menus.registerMenuAction(MODIFICATION, {
            commandId: FileNavigatorCommands.DESIGN_FILES_INCLUDE.id,
            order: 'c'
        });

        menus.registerMenuAction(MODIFICATION, {
            commandId: FileNavigatorCommands.DESIGN_FILES_EXCLUDE.id,
            order: 'c'
        });


        menus.registerMenuAction(MODIFICATION, {
            commandId: TestbenchesExplorerCommands.TESTBENCHES_ADD_BY_URI.id,
            order: 'd'
        });

        menus.registerMenuAction(MODIFICATION, {
            commandId: TestbenchesExplorerCommands.TESTBENCHES_REMOVE_BY_URI.id,
            order: 'e'
        });

    }

    registerKeybindings(registry: KeybindingRegistry): void {
        
        registry.registerKeybinding({
            command: fnc.REVEAL_IN_NAVIGATOR.id,
            keybinding: 'alt+r'
        });

        registry.registerKeybinding({
            command: WorkspaceCommands.FILE_DELETE.id,
            keybinding: isOSX ? 'cmd+backspace' : 'del',
            when: 'gestolaFileNavigatorFocus'
        });

        registry.registerKeybinding({
            command: WorkspaceCommands.FILE_RENAME.id,
            keybinding: 'f2',
            when: 'gestolaFileNavigatorFocus'
        });

    }
  
    protected withFileNavigatorWidget<T>(widget: Widget | undefined, cb: (navigator: GestolaFileNavigatorWidget) => T): T | false {
        if (widget instanceof GestolaFileNavigatorWidget) {
            return cb(widget);
        }
        return false;
    }

    async collapseFileNavigatorTree(widget: GestolaFileNavigatorWidget): Promise<void> {
        const { model } = widget;

        // collapse all child nodes which are not the root (single root workspace)
        // collapse all root nodes (multiple root workspace)
        let root = model.root as CompositeTreeNode;
        if (WorkspaceNode.is(root) && root.children.length === 1) {
            root = root.children[0];
        }
        root.children.forEach(child => CompositeTreeNode.is(child) && model.collapseAll(child));

        // select first visible node
        const firstChild = WorkspaceNode.is(root) ? root.children[0] : root;
        if (SelectableTreeNode.is(firstChild)) {
            model.selectNode(firstChild);
        }
    }
  

}