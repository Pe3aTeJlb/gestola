import { injectable, inject, postConstruct, interfaces, Container } from '@theia/core/shared/inversify';
import { Message } from '@theia/core/shared/@lumino/messaging';
import URI from '@theia/core/lib/common/uri';
import { CommandService } from '@theia/core/lib/common';
import { Key, TreeModel, ContextMenuRenderer, ExpandableTreeNode, TreeProps, TreeNode, defaultTreeProps, SelectableTreeNode, TreeSelection } from '@theia/core/lib/browser';
import { DirNode, FileStatNodeData } from '@theia/filesystem/lib/browser';
import { WorkspaceService, WorkspaceCommands } from '@theia/workspace/lib/browser';
import { isOSX, environment } from '@theia/core';
import * as React from '@theia/core/shared/react';
import { nls } from '@theia/core/lib/common/nls';
import { AbstractNavigatorTreeWidget } from "@theia/navigator/lib/browser/abstract-navigator-tree-widget";
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { createFileTreeContainer } from '@theia/filesystem/lib/browser';
import { FileNavigatorTree } from '@theia/navigator/lib/browser/navigator-tree';
import { NavigatorDecoratorService } from '@theia/navigator/lib/browser/navigator-decorator-service';
import { ConstrainsExplorerTreeModel } from './constrains-explorer-model';
import { GestolaExplorerContextKeyService } from '../../views/project-explorer-view/gestola-explorer-context-key-service';
import { CONSTRAINS_EXPLORER_CONTEXT_MENU } from './constrains-explorer-commands-contribution';
import { NavigatorContextKeyService } from '@theia/navigator/lib/browser/navigator-context-key-service';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';

export const CONSTRAINS_EXPLORER_PROPS: TreeProps = {
    ...defaultTreeProps,
    contextMenuPath: CONSTRAINS_EXPLORER_CONTEXT_MENU,
    multiSelect: false,
    search: true,
    globalSelection: true
}

@injectable()
export class ConstrainsExplorerWidget extends AbstractNavigatorTreeWidget {

    @inject(CommandService) protected readonly commandService: CommandService;
    @inject(GestolaExplorerContextKeyService) protected readonly contextKeyService: GestolaExplorerContextKeyService;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(NavigatorContextKeyService) protected readonly navigatorKeyService: NavigatorContextKeyService;
    @inject(ProjectManager) readonly projManager: ProjectManager;

    static readonly ID = 'gestola:constrains-explorer';
    static readonly VIEW_LABEL = nls.localize("gestola/topology-level-fpga/constrains-explorer-view-title", "Constrains Explorer");

    constructor(
        @inject(TreeProps) props: TreeProps,
        @inject(ConstrainsExplorerTreeModel) override readonly model: ConstrainsExplorerTreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
    ) {
        super(props, model, contextMenuRenderer);
        this.addClass('theia-Files');
    }

    @postConstruct()
    protected override init(): void {
        super.init();
        // This ensures that the context menu command to hide this widget receives the label 'Folders'
        // regardless of the name of workspace. See ViewContainer.updateToolbarItems.
        const dataset = { ...this.title.dataset };
        dataset.visibilityCommandLabel = nls.localize("gestola/topology-level-fpga/constrains-explorer-view-title", "Constrains Explorer");
        this.title.dataset = dataset;
        this.updateSelectionContextKeys();
        this.toDispose.pushAll([
            this.model.onSelectionChanged(() =>
                this.updateSelectionContextKeys()
            ),
            this.model.onExpansionChanged(node => {
                if (node.expanded && node.children.length === 1) {
                    const child = node.children[0];
                    if (ExpandableTreeNode.is(child) && !child.expanded) {
                        this.model.expandNode(child);
                    }
                }

            })
        ]);
    }

    protected override handleContextMenuEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        if (SelectableTreeNode.is(node)) {
            // Keep the selection for the context menu, if the widget support multi-selection and the right click happens on an already selected node.
            if (!this.props.multiSelect || !node.selected) {
                const type = !!this.props.multiSelect && this.hasCtrlCmdMask(event) ? TreeSelection.SelectionType.TOGGLE : TreeSelection.SelectionType.DEFAULT;
                this.model.addSelection({ node, type });
            }
            this.focusService.setFocus(node);
            const contextMenuPath = this.props.contextMenuPath;
            if (contextMenuPath) {
                const { x, y } = event.nativeEvent;
                const args = this.toContextMenuArgs(node);
                setTimeout(() => this.contextMenuRenderer.render({
                    menuPath: contextMenuPath,
                    context: event.currentTarget,
                    anchor: { x, y },
                    args: [this, node, args]
                }), 10);
            }
        }
        event.stopPropagation();
        event.preventDefault();
    }

    protected override doUpdateRows(): void {
        super.doUpdateRows();

        this.title.label = nls.localize("gestola/explorer/file-navigator-topologyLvl-vlsi", "Constrains Explorer");
        this.title.caption = this.title.label;
/*
        this.title.label = LABEL;
        if (WorkspaceNode.is(this.model.root)) {
            if (this.model.root.name === WorkspaceNode.name) {
                const rootNode = this.model.root.children[0];
                if (WorkspaceRootNode.is(rootNode)) {
                    this.title.label = this.toNodeName(rootNode);
                    this.title.caption = this.labelProvider.getLongName(rootNode.uri);
                }
            } else {
                this.title.label = this.toNodeName(this.model.root);
                this.title.caption = this.title.label;
            }
        } else {
            this.title.caption = this.title.label;
        }*/
    }

    override getContainerTreeNode(): TreeNode | undefined {
        const root = this.model.root;
        if (this.workspaceService.isMultiRootWorkspaceOpened) {
            return root;
        }
        if (WorkspaceNode.is(root)) {
            return root.children[0];
        }
        return undefined;
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }

    protected override shouldShowWelcomeView(): boolean {
        return this.model.root === undefined;
    }

    protected override onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.addClipboardListener(this.node, 'copy', e => this.handleCopy(e));
        this.addClipboardListener(this.node, 'paste', e => this.handlePaste(e));
    }

    protected handleCopy(event: ClipboardEvent): void {
        const uris = this.model.selectedFileStatNodes.map(node => node.uri.toString());
        if (uris.length > 0 && event.clipboardData) {
            event.clipboardData.setData('text/plain', uris.join('\n'));
            event.preventDefault();
        }
    }

    protected handlePaste(event: ClipboardEvent): void {
        if (event.clipboardData) {
            const raw = event.clipboardData.getData('text/plain');
            if (!raw) {
                return;
            }
            const target = this.model.selectedFileStatNodes[0];
            if (!target) {
                return;
            }
            for (const file of raw.split('\n')) {
                event.preventDefault();
                const source = new URI(file);
                this.model.copy(source, target);
            }
        }
    }

    protected canOpenWorkspaceFileAndFolder: boolean = isOSX || !environment.electron.is();

    protected readonly openWorkspace = () => this.doOpenWorkspace();
    protected doOpenWorkspace(): void {
        this.commandService.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id);
    }

    protected readonly openFolder = () => this.doOpenFolder();
    protected doOpenFolder(): void {
        this.commandService.executeCommand(WorkspaceCommands.OPEN_FOLDER.id);
    }

    protected readonly addFolder = () => this.doAddFolder();
    protected doAddFolder(): void {
        this.commandService.executeCommand(WorkspaceCommands.ADD_FOLDER.id);
    }

    protected readonly keyUpHandler = (e: React.KeyboardEvent) => {
        if (Key.ENTER.keyCode === e.keyCode) {
            (e.target as HTMLElement).click();
        }
    };

    protected isEmptyMultiRootWorkspace(model: TreeModel): boolean {
        return WorkspaceNode.is(model.root) && model.root.children.length === 0;
    }

    protected override tapNode(node?: TreeNode): void {
        if (node && this.corePreferences['workbench.list.openMode'] === 'singleClick') {
            this.model.previewNode(node);
        }
        super.tapNode(node);
    }

    protected override onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.contextKeyService.explorerViewletVisible.set(true);
        this.navigatorKeyService.explorerViewletVisible.set(true);
    }

    protected override onAfterHide(msg: Message): void {
        super.onAfterHide(msg);
        this.contextKeyService.explorerViewletVisible.set(false);
        this.navigatorKeyService.explorerViewletVisible.set(false);
    }

    protected updateSelectionContextKeys(): void {
        this.contextKeyService.fileNavigatorResourceIsFolder.set(DirNode.is(this.model.selectedNodes[0]));
        this.navigatorKeyService.explorerResourceIsFolder.set(DirNode.is(this.model.selectedNodes[0]));
        // As `FileStatNode` only created if `FileService.resolve` was successful, we can safely assume that
        // a valid `FileSystemProvider` is available for the selected node. So we skip an additional check
        // for provider availability here and check the node type.
        this.navigatorKeyService.isFileSystemResource.set(FileStatNodeData.is(this.model.selectedNodes[0]));
    }

}

export function createConstrainsExplorerContainer(parent: interfaces.Container): Container {

    
    const widget = createFileTreeContainer(parent, {
        tree: FileNavigatorTree,
        model: ConstrainsExplorerTreeModel,
        widget: ConstrainsExplorerWidget,
        decoratorService: NavigatorDecoratorService,
        props: {
            ...CONSTRAINS_EXPLORER_PROPS
        },
    });

    return widget;

}

export function createFileNavigatorWidget(parent: interfaces.Container): ConstrainsExplorerWidget {
    return createConstrainsExplorerContainer(parent).get(ConstrainsExplorerWidget);
}

