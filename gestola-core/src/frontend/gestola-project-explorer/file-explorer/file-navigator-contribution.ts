import { Command, CommandContribution, CommandRegistry, isOSX, nls } from "@theia/core";
import { CommonCommands, CompositeTreeNode, KeybindingContribution, KeybindingRegistry, SelectableTreeNode, Widget, codicon } from "@theia/core/lib/browser";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { inject, injectable } from "@theia/core/shared/inversify";
import { GestolaFileNavigatorWidget } from "./file-navigator-widget";
import { ProjectManager } from "../../project-manager/project-manager";
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { FileNavigatorCommands } from "./trash";

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

@injectable()
export class GestolaFileNavigatorContribution implements CommandContribution, TabBarToolbarContribution, KeybindingContribution {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(TabBarToolbarRegistry)
    protected readonly tabbarToolbarRegistry: TabBarToolbarRegistry;

    @inject(KeybindingRegistry)
    protected readonly keybindingRegistry: KeybindingRegistry;

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;


    registerCommands(registry: CommandRegistry): void {
       
        registry.registerCommand(COLLAPSE_ALL, {
            execute: widget => this.withWidget(widget, (widget) => this.collapseFileNavigatorTree(widget)),
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
        registry.registerCommand(REFRESH_NAVIGATOR, {
            execute: widget => {
                this.withWidget(widget, (widget) => this.refreshWorkspace(widget));
            },
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
        registry.registerCommand(NEW_FILE_TOOLBAR, {
            execute: (...args) => {
                if(args[0] instanceof GestolaFileNavigatorWidget){
                    if((<GestolaFileNavigatorWidget> args[0]).model.getFocusedNode()){
                        registry.executeCommand(WorkspaceCommands.NEW_FILE.id, ...args);
                    } else {
                        registry.executeCommand(WorkspaceCommands.NEW_FILE.id, args[0].model.rootURI);
                    }   
                }
            },
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
        registry.registerCommand(NEW_FOLDER_TOOLBAR, {
            execute: (...args) => {
                if(args[0] instanceof GestolaFileNavigatorWidget){
                    if((<GestolaFileNavigatorWidget> args[0]).model.getFocusedNode()){
                        registry.executeCommand(WorkspaceCommands.NEW_FOLDER.id, ...args);
                    } else {
                        registry.executeCommand(WorkspaceCommands.NEW_FOLDER.id, args[0].model.rootURI);
                    }   
                }
            },
            isEnabled: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined),
            isVisible: widget => this.withWidget(widget, () => this.projManager.currProj !== undefined)
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: FileNavigatorCommands.REVEAL_IN_NAVIGATOR.id,
            keybinding: 'alt+r'
        });

        registry.registerKeybinding({
            command: WorkspaceCommands.FILE_DELETE.id,
            keybinding: isOSX ? 'cmd+backspace' : 'del',
            when: 'gestolaFileNavigatorFocus && focusedView == gestolaFileNavigatorId'
        });

        registry.registerKeybinding({
            command: WorkspaceCommands.FILE_RENAME.id,
            keybinding: 'f2',
            when: 'gestolaFileNavigatorFocus && focusedView == "gestole-project-explorer-view-container--file-navigator-system-model"'
        });
    }

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

    protected withWidget<T>(widget: Widget | undefined, cb: (navigator: GestolaFileNavigatorWidget) => T): T | false {
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

    async refreshWorkspace(widget: GestolaFileNavigatorWidget): Promise<void> {
        const { model } = widget;
        await model.refresh();
    }


}