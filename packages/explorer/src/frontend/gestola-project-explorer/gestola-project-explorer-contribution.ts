import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ProjectExplorerWidget } from './project-explorer/project-explorer-widget';
import { GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID } from './gestola-project-explorer-widget-factory';
import { Command, CommandRegistry, MenuModelRegistry, MenuPath, SelectionService, URI, isOSX, nls } from "@theia/core";
import { CommonCommands, CommonMenus, CompositeTreeNode, FrontendApplicationContribution, KeybindingRegistry, SHELL_TABBAR_CONTEXT_MENU, SelectableTreeNode, Widget, codicon } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { ProjectManagerCommands } from '@gestola/project-manager/lib/frontend/project-manager/project-manager-commands';
import { GestolaExplorerContextKeyService } from './gestola-explorer-context-key-service';
import { GestolaFileNavigatorWidget } from './file-explorer/file-navigator-widget';
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { WorkspaceCommands, WorkspaceCommandContribution } from '@theia/workspace/lib/browser';
import { FileNavigatorCommands } from '@theia/navigator/lib/browser/file-navigator-commands';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { SolutionExplorerWidget } from './solution-explorer/solution-explorer-widget';
import { UriAwareCommandHandler, UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { DesignFilesExcludeHandler } from './design-exclude-handler';
import { DesignFilesIncludeHandler } from './design-include-handler';
import { DesignSetTopModuleHandler } from './design-set-top-handler';
import { ModuleHierarchyTreeWidget } from './module-hierarchy/module-hierarchy-widget';

export const PROJECT_EXPLORER_TOGGLE_COMMAND: Command = {
    id: "project-explorer:toggle",
    label: ProjectExplorerWidget.MENU_LABEL
};
export const REFRESH_NAVIGATOR = Command.toLocalizedCommand({
    id: 'gestola-explorer.refresh',
    category: CommonCommands.FILE_CATEGORY,
    label: 'Refresh in Explorer',
    iconClass: codicon('refresh')
}, 'theia/navigator/refresh', CommonCommands.FILE_CATEGORY_KEY);
export const COLLAPSE_ALL = Command.toDefaultLocalizedCommand({
    id: 'gestola-explorer.collapse.all',
    category: CommonCommands.FILE_CATEGORY,
    label: 'Collapse Folders in Explorer',
    iconClass: codicon('collapse-all')
});
export const NEW_FILE_TOOLBAR: Command = {
    id: `gestola-explorer.newfile.toolbar`,
    iconClass: codicon('new-file')
};
export const NEW_FOLDER_TOOLBAR: Command = {
    id: `gestola-explorer.newfolder.toolbar`,
    iconClass: codicon('new-folder')
};

/**
* Navigator `More Actions...` toolbar item groups.
* Used in order to group items present in the toolbar.
*/
export namespace NavigatorMoreToolbarGroups {
   export const NEW_OPEN = '1_navigator_new_open';
   export const TOOLS = '2_navigator_tools';
   export const WORKSPACE = '3_navigator_workspace';
}

export const NAVIGATOR_CONTEXT_MENU: MenuPath = ['navigator-context-menu'];
export const SHELL_TABBAR_CONTEXT_REVEAL: MenuPath = [...SHELL_TABBAR_CONTEXT_MENU, '2_reveal'];

/**
* Navigator context menu default groups should be aligned
* with VS Code default groups: https://code.visualstudio.com/api/references/contribution-points#contributes.menus
*/
export namespace NavigatorContextMenu {
   export const NAVIGATION = [...NAVIGATOR_CONTEXT_MENU, 'navigation'];
   /** @deprecated use NAVIGATION */
   export const OPEN = NAVIGATION;
   /** @deprecated use NAVIGATION */
   export const NEW = NAVIGATION;

   export const WORKSPACE = [...NAVIGATOR_CONTEXT_MENU, '2_workspace'];

   export const COMPARE = [...NAVIGATOR_CONTEXT_MENU, '3_compare'];
   /** @deprecated use COMPARE */
   export const DIFF = COMPARE;

   export const SEARCH = [...NAVIGATOR_CONTEXT_MENU, '4_search'];
   export const CLIPBOARD = [...NAVIGATOR_CONTEXT_MENU, '5_cutcopypaste'];

   export const MODIFICATION = [...NAVIGATOR_CONTEXT_MENU, '7_modification'];
   /** @deprecated use MODIFICATION */
   export const MOVE = MODIFICATION;
   /** @deprecated use MODIFICATION */
   export const ACTIONS = MODIFICATION;

   export const OPEN_WITH = [...NAVIGATION, 'open_with'];
}

@injectable()
export class GestolaProjectExplorerViewContribution extends AbstractViewContribution<ProjectExplorerWidget> implements FrontendApplicationContribution, TabBarToolbarContribution {

    @inject(GestolaExplorerContextKeyService)
    protected readonly contextKeyService: GestolaExplorerContextKeyService;

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(WorkspaceCommandContribution)
    protected readonly workspaceCommandContribution: WorkspaceCommandContribution;

    @inject(SelectionService) 
    protected readonly selectionService: SelectionService;

    @inject(DesignFilesIncludeHandler) 
    protected readonly designFilesIncludeHandler: DesignFilesIncludeHandler;

    @inject(DesignFilesExcludeHandler) 
    protected readonly designFilesExcludeHandler: DesignFilesExcludeHandler;

    @inject(DesignSetTopModuleHandler) 
    protected readonly designSetTopModuleHandler: DesignSetTopModuleHandler;

    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
    ) {
        super({
            viewContainerId: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: ProjectExplorerWidget.MENU_LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: PROJECT_EXPLORER_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {

        await this.fileNavigatorPreferences.ready;

        const updateFocusContextKeys = () => {
            const hasFocus = this.shell.activeWidget instanceof GestolaFileNavigatorWidget;
            this.contextKeyService.explorerViewletFocus.set(hasFocus);
            this.contextKeyService.filesNavigatorFocus.set(hasFocus);
            if(hasFocus){
                (<GestolaFileNavigatorWidget>this.shell.activeWidget).model.applySelection();
            }
        };
        updateFocusContextKeys();
        this.shell.onDidChangeActiveWidget(updateFocusContextKeys);

    }

    protected newUriAwareCommandHandler(handler: UriCommandHandler<URI>): UriAwareCommandHandler<URI> {
        return UriAwareCommandHandler.MonoSelect(this.selectionService, handler);
    }

    protected newMultiUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]> {
        return UriAwareCommandHandler.MultiSelect(this.selectionService, handler);
    }

    protected withProjectExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: ProjectExplorerWidget) => T): T | false {
        if (widget instanceof ProjectExplorerWidget) {
            return cb(widget);
        }
        return false;
    }

    protected withSolutionExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: SolutionExplorerWidget) => T): T | false {
        if (widget instanceof SolutionExplorerWidget) {
            return cb(widget);
        }
        return false;
    }

    protected withModulesHierarchyWidget<T>(widget: Widget | undefined, cb: (navigator: ModuleHierarchyTreeWidget) => T): T | false {
        if (widget instanceof ModuleHierarchyTreeWidget) {
            return cb(widget);
        }
        return false;
    }

    protected withFileNavigatorWidget<T>(widget: Widget | undefined, cb: (navigator: GestolaFileNavigatorWidget) => T): T | false {
        if (widget instanceof GestolaFileNavigatorWidget) {
            return cb(widget);
        }
        return false;
    }

  
    override registerCommands(commands: CommandRegistry): void {

        super.registerCommands(commands);

        commands.registerCommand(ProjectManagerCommands.CREATE_GESTOLA_PROJECT, {
            isEnabled: widget => this.withProjectExplorerWidget(widget, () => true),
            isVisible: widget => this.withProjectExplorerWidget(widget, () => true),
            execute: () =>  this.projManager.createProject()
        });

        commands.registerCommand(ProjectManagerCommands.OPEN_GESTOLA_PROJECT, {
            isEnabled: widget => this.withProjectExplorerWidget(widget, () => true),
            isVisible: widget => this.withProjectExplorerWidget(widget, () => true),
            execute: () => this.projManager.openProject()
        });



        commands.registerCommand(ProjectManagerCommands.CREATE_SOLUTION, {
            isEnabled: widget => this.withSolutionExplorerWidget(widget, () => true),
            isVisible: widget => this.withSolutionExplorerWidget(widget, () => true),
            execute: () => this.projManager.createSolution()
        });


        commands.registerCommand(ProjectManagerCommands.REFRESH_MODULES_HIERARCHY, {
            isEnabled: widget => this.withModulesHierarchyWidget(widget, () => true),
            isVisible: widget => this.withModulesHierarchyWidget(widget, () => true),
            execute: widget => this.withModulesHierarchyWidget(widget, (widget) => widget.model.refresh()),
        });




        commands.registerCommand(ProjectManagerCommands.DESIGN_FILES_INCLUDE, this.newMultiUriAwareCommandHandler(this.designFilesIncludeHandler));
        commands.registerCommand(ProjectManagerCommands.DESIGN_FILES_EXCLUDE, this.newMultiUriAwareCommandHandler(this.designFilesExcludeHandler));
        commands.registerCommand(ProjectManagerCommands.DESIGN_SET_TOP_MODULE, this.newUriAwareCommandHandler(this.designSetTopModuleHandler));



        commands.registerCommand(COLLAPSE_ALL, {
            execute: widget => this.withFileNavigatorWidget(widget, (widget) => this.collapseFileNavigatorTree(widget)),
            isEnabled: widget => this.withFileNavigatorWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withFileNavigatorWidget(widget, () => true)
        });
        commands.registerCommand(REFRESH_NAVIGATOR, {
            execute: widget => this.withFileNavigatorWidget(widget, (widget) => this.refreshWorkspace(widget)),
            isEnabled: widget => this.withFileNavigatorWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withFileNavigatorWidget(widget, () => true)
        });
        commands.registerCommand(NEW_FILE_TOOLBAR, {
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
        commands.registerCommand(NEW_FOLDER_TOOLBAR, {
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
    
    override registerMenus(menus: MenuModelRegistry): void {

        super.registerMenus(menus);

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            label: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.label,
            order: 'a'
        });

        menus.registerMenuAction(CommonMenus.FILE, {
            commandId: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            order: 'a'
        });

        menus.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: ProjectManagerCommands.DESIGN_SET_TOP_MODULE.id,
            order: 'b'
        });

        menus.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: ProjectManagerCommands.DESIGN_FILES_INCLUDE.id,
            order: 'c'
        });

        menus.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: ProjectManagerCommands.DESIGN_FILES_EXCLUDE.id,
            order: 'c'
        });


    }

    override registerKeybindings(registry: KeybindingRegistry): void {

        super.registerKeybindings(registry);

        registry.registerKeybinding({
            command: FileNavigatorCommands.REVEAL_IN_NAVIGATOR.id,
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

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
       
        registry.registerItem({
            id: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            command: ProjectManagerCommands.CREATE_GESTOLA_PROJECT.id,
            tooltip: nls.localize('gestola/project-manager/create-gestola-project', 'Create Gestola Project'),
            priority: 0,
        });

        registry.registerItem({
            id: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            command: ProjectManagerCommands.OPEN_GESTOLA_PROJECT.id,
            tooltip: nls.localize('gestola/project-manager/open-gestola-project', 'Open Gestola Project'),
            priority: 1,
        });

        registry.registerItem({
            id: ProjectManagerCommands.CREATE_SOLUTION.id,
            command: ProjectManagerCommands.CREATE_SOLUTION.id,
            tooltip: nls.localize('gestola/project-manager/create-solution', 'Create Solution'),
            priority: 0,
        });

        registry.registerItem({
            id: NEW_FILE_TOOLBAR.id,
            command: NEW_FILE_TOOLBAR.id,
            tooltip: nls.localizeByDefault('New File...'),
            priority: 0,
        });
        registry.registerItem({
            id: NEW_FOLDER_TOOLBAR.id,
            command: NEW_FOLDER_TOOLBAR.id,
            tooltip: nls.localizeByDefault('New Folder...'),
            priority: 1,
        });
        registry.registerItem({
            id: REFRESH_NAVIGATOR.id,
            command: REFRESH_NAVIGATOR.id,
            tooltip: nls.localizeByDefault('Refresh Explorer'),
            priority: 2,
        });
        registry.registerItem({
            id: COLLAPSE_ALL.id,
            command: COLLAPSE_ALL.id,
            tooltip: nls.localizeByDefault('Collapse All'),
            priority: 3,
        });


        registry.registerItem({
            id: ProjectManagerCommands.REFRESH_MODULES_HIERARCHY.id,
            command: ProjectManagerCommands.REFRESH_MODULES_HIERARCHY.id,
            tooltip: 'Refresh',
            priority: 1,
        });

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

    async refreshWorkspace(widget: GestolaFileNavigatorWidget): Promise<void> {
        widget.model.refresh();
    }

}