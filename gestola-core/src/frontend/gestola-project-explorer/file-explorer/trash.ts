import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import {
    CompositeTreeNode,
    FrontendApplication,
    FrontendApplicationContribution,
    OpenerService,
    PreferenceService,
    SelectableTreeNode,
    Widget,
    NavigatableWidget,
    SHELL_TABBAR_CONTEXT_MENU,
    codicon,
    CommonCommands
} from '@theia/core/lib/browser';
import {
    CommandRegistry,
   // isOSX,
    MenuModelRegistry,
    MenuPath,
    nls,
    Command,
} from '@theia/core/lib/common';
import {
    DidCreateNewResourceEvent,
    WorkspaceCommandContribution,
    WorkspaceCommands,
    WorkspacePreferences,
    WorkspaceService
} from '@theia/workspace/lib/browser';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { FileNavigatorFilter } from '@theia/navigator/lib/browser/navigator-filter';
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { NavigatorContextKeyService } from '@theia/navigator/lib/browser/navigator-context-key-service';
import {
    TabBarToolbarContribution,
    TabBarToolbarRegistry
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { NavigatorDiff } from '@theia/navigator/lib/browser/navigator-diff';
import { DirNode, FileNode } from '@theia/filesystem/lib/browser';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import URI from '@theia/core/lib/common/uri';
import { FileNavigatorCommands } from '@theia/navigator/lib/browser/file-navigator-commands';
import { GESTOLA_FILE_NAVIGATOR_ID, LABEL } from './file-navigator-widget';
import { GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID } from '../gestola-project-explorer-widget-factory';
import { ProjectManager } from '../../project-manager/project-manager';
import { GestolaFileNavigatorWidget } from './file-navigator-widget';
import { GestolaFileNavigatorModel } from './file-navigator-model';
export { FileNavigatorCommands };

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

export const FILE_NAVIGATOR_TOGGLE_COMMAND_ID = 'fileNavigator:toggle';

@injectable()
export class GestolaFileNavigatorContribution extends AbstractViewContribution<GestolaFileNavigatorWidget> implements FrontendApplicationContribution, TabBarToolbarContribution {

    @inject(ClipboardService)
    protected readonly clipboardService: ClipboardService;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(TabBarToolbarRegistry)
    protected readonly tabbarToolbarRegistry: TabBarToolbarRegistry;

    @inject(NavigatorContextKeyService)
    protected readonly contextKeyService: NavigatorContextKeyService;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(NavigatorDiff)
    protected readonly navigatorDiff: NavigatorDiff;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @inject(SelectionService)
    protected readonly selectionService: SelectionService;

    @inject(WorkspaceCommandContribution)
    protected readonly workspaceCommandContribution: WorkspaceCommandContribution;

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
        @inject(OpenerService) protected readonly openerService: OpenerService,
        @inject(FileNavigatorFilter) protected readonly fileNavigatorFilter: FileNavigatorFilter,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService,
        @inject(WorkspacePreferences) protected readonly workspacePreferences: WorkspacePreferences
    ) {
        super({
            viewContainerId: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
            widgetId: GESTOLA_FILE_NAVIGATOR_ID,
            widgetName: LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 100
            },
            toggleCommandId: "gestola-core-file-navigator:toggle"
        });
    }

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {
        await this.fileNavigatorPreferences.ready;
        this.shell.onDidChangeCurrentWidget(() => this.onCurrentWidgetChangedHandler());

        const updateFocusContextKeys = () => {
            const hasFocus = this.shell.activeWidget instanceof GestolaFileNavigatorWidget;
            this.contextKeyService.explorerViewletFocus.set(hasFocus);
            this.contextKeyService.filesExplorerFocus.set(hasFocus);
        };
        updateFocusContextKeys();
        this.shell.onDidChangeActiveWidget(updateFocusContextKeys);
        this.workspaceCommandContribution.onDidCreateNewFile(async event => this.onDidCreateNewResource(event));
        this.workspaceCommandContribution.onDidCreateNewFolder(async event => this.onDidCreateNewResource(event));
        this.projManager.onDidChangeProject(async () => this.refreshWorkspace());
    }

    private async onDidCreateNewResource(event: DidCreateNewResourceEvent): Promise<void> {
        const navigator = this.tryGetWidget();
        if (!navigator || !navigator.isVisible) {
            return;
        }
        const model: GestolaFileNavigatorModel = navigator.model;
        const parent = await model.revealFile(event.parent);
        if (DirNode.is(parent)) {
            await model.refresh(parent);
        }
        const node = await model.revealFile(event.uri);
        if (SelectableTreeNode.is(node)) {
            model.selectNode(node);
            if (DirNode.is(node)) {
                this.openView({ activate: true });
            }
        }
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

    override registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.registerCommand(FileNavigatorCommands.COLLAPSE_ALL, {
            execute: widget => this.withWidget(widget, () => this.collapseFileNavigatorTree()),
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
        registry.registerCommand(FileNavigatorCommands.REFRESH_NAVIGATOR, {
            execute: widget => this.withWidget(widget, () => this.refreshWorkspace()),
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
        registry.registerCommand(FileNavigatorCommands.NEW_FILE_TOOLBAR, {
            execute: (...args) => registry.executeCommand(WorkspaceCommands.NEW_FILE.id, ...args),
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
        registry.registerCommand(FileNavigatorCommands.NEW_FOLDER_TOOLBAR, {
            execute: (...args) => registry.executeCommand(WorkspaceCommands.NEW_FOLDER.id, ...args),
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
    }

    protected getSelectedFileNodes(): FileNode[] {
        return this.tryGetWidget()?.model.selectedNodes.filter(FileNode.is) || [];
    }

    protected withWidget<T>(widget: Widget | undefined = this.tryGetWidget(), cb: (navigator: GestolaFileNavigatorWidget) => T): T | false {
        if (widget instanceof GestolaFileNavigatorWidget) {
            return cb(widget);
        }
        return false;
    }

/*
    override registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        registry.registerMenuAction(SHELL_TABBAR_CONTEXT_REVEAL, {
            commandId: FileNavigatorCommands.REVEAL_IN_NAVIGATOR.id,
            label: FileNavigatorCommands.REVEAL_IN_NAVIGATOR.label,
            order: '5'
        });

        registry.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
            commandId: FileNavigatorCommands.OPEN.id,
            label: FileNavigatorCommands.OPEN.label
        });
        registry.registerSubmenu(NavigatorContextMenu.OPEN_WITH, nls.localizeByDefault('Open With...'));
        this.openerService.getOpeners().then(openers => {
            for (const opener of openers) {
                const openWithCommand = WorkspaceCommands.FILE_OPEN_WITH(opener);
                registry.registerMenuAction(NavigatorContextMenu.OPEN_WITH, {
                    commandId: openWithCommand.id,
                    label: opener.label,
                    icon: opener.iconClass
                });
            }
        });

        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY.id,
            order: 'a'
        });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: CommonCommands.PASTE.id,
            order: 'b'
        });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY_PATH.id,
            order: 'c'
        });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: WorkspaceCommands.COPY_RELATIVE_FILE_PATH.id,
            label: WorkspaceCommands.COPY_RELATIVE_FILE_PATH.label,
            order: 'd'
        });
        registry.registerMenuAction(NavigatorContextMenu.CLIPBOARD, {
            commandId: FileDownloadCommands.COPY_DOWNLOAD_LINK.id,
            order: 'z'
        });

        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_RENAME.id
        });
        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_DELETE.id
        });
        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_DUPLICATE.id
        });

        const downloadUploadMenu = [...NAVIGATOR_CONTEXT_MENU, '6_downloadupload'];
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileSystemCommands.UPLOAD.id,
            order: 'a'
        });
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileDownloadCommands.DOWNLOAD.id,
            order: 'b'
        });

        registry.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
            commandId: WorkspaceCommands.NEW_FILE.id,
            when: 'explorerResourceIsFolder'
        });
        registry.registerMenuAction(NavigatorContextMenu.NAVIGATION, {
            commandId: WorkspaceCommands.NEW_FOLDER.id,
            when: 'explorerResourceIsFolder'
        });
        registry.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: WorkspaceCommands.FILE_COMPARE.id
        });
        registry.registerMenuAction(NavigatorContextMenu.MODIFICATION, {
            commandId: FileNavigatorCommands.COLLAPSE_ALL.id,
            label: nls.localizeByDefault('Collapse All'),
            order: 'z2'
        });

        registry.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_FIRST.id,
            order: 'za'
        });
        registry.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_SECOND.id,
            order: 'zb'
        });

        // Open Editors Widget Menu Items
        registry.registerMenuAction(OpenEditorsContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY_PATH.id,
            order: 'a'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.CLIPBOARD, {
            commandId: WorkspaceCommands.COPY_RELATIVE_FILE_PATH.id,
            order: 'b'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.SAVE, {
            commandId: CommonCommands.SAVE.id,
            order: 'a'
        });

        registry.registerMenuAction(OpenEditorsContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_FIRST.id,
            order: 'a'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_SECOND.id,
            order: 'b'
        });

        registry.registerMenuAction(OpenEditorsContextMenu.MODIFICATION, {
            commandId: CommonCommands.CLOSE_TAB.id,
            label: nls.localizeByDefault('Close'),
            order: 'a'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.MODIFICATION, {
            commandId: CommonCommands.CLOSE_OTHER_TABS.id,
            label: nls.localizeByDefault('Close Others'),
            order: 'b'
        });
        registry.registerMenuAction(OpenEditorsContextMenu.MODIFICATION, {
            commandId: CommonCommands.CLOSE_ALL_MAIN_TABS.id,
            label: nls.localizeByDefault('Close All'),
            order: 'c'
        });

        registry.registerMenuAction(NavigatorContextMenu.WORKSPACE, {
            commandId: FileNavigatorCommands.ADD_ROOT_FOLDER.id,
            label: WorkspaceCommands.ADD_FOLDER.label
        });
        registry.registerMenuAction(NavigatorContextMenu.WORKSPACE, {
            commandId: WorkspaceCommands.REMOVE_FOLDER.id
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
            when: 'filesExplorerFocus'
        });

        registry.registerKeybinding({
            command: WorkspaceCommands.FILE_RENAME.id,
            keybinding: 'f2',
            when: 'filesExplorerFocus'
        });

        registry.registerKeybinding({
            command: FileNavigatorCommands.TOGGLE_HIDDEN_FILES.id,
            keybinding: 'ctrlcmd+i',
            when: 'filesExplorerFocus'
        });
    }
*/
    async registerToolbarItems(toolbarRegistry: TabBarToolbarRegistry): Promise<void> {
        toolbarRegistry.registerItem({
            id: NEW_FILE_TOOLBAR.id,
            command: NEW_FILE_TOOLBAR.id,
            tooltip: nls.localizeByDefault('New File...'),
            priority: 0,
        });
        toolbarRegistry.registerItem({
            id: NEW_FOLDER_TOOLBAR.id,
            command: NEW_FOLDER_TOOLBAR.id,
            tooltip: nls.localizeByDefault('New Folder...'),
            priority: 1,
        });
        toolbarRegistry.registerItem({
            id: REFRESH_NAVIGATOR.id,
            command: REFRESH_NAVIGATOR.id,
            tooltip: nls.localizeByDefault('Refresh Explorer'),
            priority: 2,
        });
        toolbarRegistry.registerItem({
            id: COLLAPSE_ALL.id,
            command: COLLAPSE_ALL.id,
            tooltip: nls.localizeByDefault('Collapse All'),
            priority: 3,
        });
    }

    
    /**
     * Reveals and selects node in the file navigator to which given widget is related.
     * Does nothing if given widget undefined or doesn't have related resource.
     *
     * @param widget widget file resource of which should be revealed and selected
     */
    async selectWidgetFileNode(widget: Widget | undefined): Promise<boolean> {
        return this.selectFileNode(NavigatableWidget.getUri(widget));
    }

    async selectFileNode(uri?: URI): Promise<boolean> {
        if (uri) {
            const { model } = await this.widget;
            const node = await model.revealFile(uri);
            if (SelectableTreeNode.is(node)) {
                model.selectNode(node);
                return true;
            }
        }
        return false;
    }

    protected onCurrentWidgetChangedHandler(): void {
        if (this.fileNavigatorPreferences['explorer.autoReveal']) {
            this.selectWidgetFileNode(this.shell.currentWidget);
        }
    }

    /**
     * Collapse file navigator nodes and set focus on first visible node
     * - single root workspace: collapse all nodes except root
     * - multiple root workspace: collapse all nodes, even roots
     */
    async collapseFileNavigatorTree(): Promise<void> {
        const { model } = await this.widget;

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

    /**
     * force refresh workspace in navigator
     */
    async refreshWorkspace(): Promise<void> {
        const { model } = await this.widget;
        await model.refresh();
    }

}

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