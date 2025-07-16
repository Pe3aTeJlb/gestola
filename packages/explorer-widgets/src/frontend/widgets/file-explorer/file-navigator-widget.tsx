import { injectable, inject, postConstruct, interfaces, Container } from '@theia/core/shared/inversify';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import URI from '@theia/core/lib/common/uri';
import { CommandService } from '@theia/core/lib/common';
import { Key, TreeModel, ContextMenuRenderer, ExpandableTreeNode, TreeProps, TreeNode, defaultTreeProps, NodeProps, codicon } from '@theia/core/lib/browser';
import { DirNode, FileStatNodeData  } from '@theia/filesystem/lib/browser';
import { WorkspaceService, WorkspaceCommands } from '@theia/workspace/lib/browser';
import { isOSX, environment } from '@theia/core';
import * as React from '@theia/core/shared/react';
import { nls } from '@theia/core/lib/common/nls';
import { AbstractNavigatorTreeWidget } from "@theia/navigator/lib/browser/abstract-navigator-tree-widget";
import { WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { createFileTreeContainer } from '@theia/filesystem/lib/browser';
import { FileNavigatorTree } from '@theia/navigator/lib/browser/navigator-tree';
import { NavigatorDecoratorService } from '@theia/navigator/lib/browser/navigator-decorator-service';
import { GestolaFileNavigatorModel } from './file-navigator-model';
import { GestolaExplorerContextKeyService } from '../../views/project-explorer-view/gestola-explorer-context-key-service';
import { NavigatorContextKeyService } from '@theia/navigator/lib/browser/navigator-context-key-service';
import { NAVIGATOR_CONTEXT_MENU } from './file-navigator-commands-contribution';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';

export const GESTOLA_FILE_NAVIGATOR_ID = 'gestola:file-navigator';
export const LABEL = nls.localize('theia/navigator/noFolderOpened', 'No Folder Opened');
export const CLASS = 'theia-Files';

export const GESTOLA_FILE_NAVIGATOR_PROPS: TreeProps = {
    ...defaultTreeProps,
    contextMenuPath: NAVIGATOR_CONTEXT_MENU,
    multiSelect: true,
    search: true,
    globalSelection: true
};

export const GestolaFileNavigatorOptions = Symbol('GestolaFileNavigatorOptions');
export interface GestolaFileNavigatorOptions {
    readonly navigatorID: string;
    readonly viewContainerID: string;
}

@injectable()
export class GestolaFileNavigatorWidget extends AbstractNavigatorTreeWidget {

    @inject(CommandService) protected readonly commandService: CommandService;
    @inject(GestolaExplorerContextKeyService) protected readonly contextKeyService: GestolaExplorerContextKeyService;
    @inject(NavigatorContextKeyService) protected readonly navigatorKeyService: NavigatorContextKeyService;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(ProjectManager) readonly projManager: ProjectManager;

    constructor(
        @inject(TreeProps) props: TreeProps,
        @inject(GestolaFileNavigatorModel) override readonly model: GestolaFileNavigatorModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(GestolaFileNavigatorOptions) opt: GestolaFileNavigatorOptions,
    ) {
        super(props, model, contextMenuRenderer);
        if(opt){
            this.id = opt.navigatorID;
            this.model.navigatorId = opt.navigatorID;
        }
        this.addClass(CLASS);

    }

    @postConstruct()
    protected override init(): void {
        super.init();
        // This ensures that the context menu command to hide this widget receives the label 'Folders'
        // regardless of the name of workspace. See ViewContainer.updateToolbarItems.
        const dataset = { ...this.title.dataset };
        switch(this.model.navigatorId){        
            case "file-navigator-system": 
                dataset.visibilityCommandLabel = nls.localize("gestola/explorer/file-navigator-systemLvl", "System Model"); 
                break;
            case "file-navigator-rtl":
                dataset.visibilityCommandLabel = nls.localize("gestola/explorer/file-navigator-rtlLvl", "RTL Model"); 
                break;
            case "file-navigator-fpga": 
                dataset.visibilityCommandLabel = nls.localize("gestola/explorer/file-navigator-topologyLvl-fpga", "FPGA"); 
                break;
            case "file-navigator-fpga-synth-results": 
                dataset.visibilityCommandLabel = nls.localize("gestola/explorer/file-navigator-topologyLvl-fpga", "Synthesis Results"); 
                break;
            case "file-navigator-fpga-impl-results": 
                dataset.visibilityCommandLabel = nls.localize("gestola/explorer/file-navigator-topologyLvl-fpga", "Implementation Results"); 
                break;
            case "file-navigator-vlsi": 
                dataset.visibilityCommandLabel = nls.localize("gestola/explorer/file-navigator-topologyLvl-vlsi", "VLSI"); 
                break;
            case "file-navigator-misc": 
                dataset.visibilityCommandLabel = nls.localize("gestola/explorer/file-navigator-miscFiles", "Misc Files"); 
                break;
            case "file-navigator-rtl-simresults":
                dataset.visibilityCommandLabel = nls.localize("gestola/rtl-level/simulation-results", "Simulation Restults"); 
                break;
        }
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

    protected override doUpdateRows(): void {
        super.doUpdateRows();

        switch(this.model.navigatorId){        
            case "file-navigator-system": 
                this.title.label = nls.localize("gestola/explorer/file-navigator-systemLvl", "System Model"); 
                break;
            case "file-navigator-rtl":   
                this.title.label = nls.localize("gestola/explorer/file-navigator-rtlLvl", "RTL Model"); 
                break;
            case "file-navigator-fpga": 
                this.title.label = nls.localize("gestola/explorer/file-navigator-fpgaLvl", "FPGA"); 
                break;
            case "file-navigator-fpga-synth-results": 
                this.title.label = nls.localize("gestola/explorer/file-navigator-fpgaLvl", "Synthesis Results"); 
                break;
            case "file-navigator-fpga-impl-results": 
                this.title.label = nls.localize("gestola/explorer/file-navigator-fpgaLvl", "Implementation Results"); 
                break;
            case "file-navigator-vlsi": 
                this.title.label = nls.localize("gestola/explorer/file-navigator-vlsi", "VLSI"); 
                break;
            case "file-navigator-misc": 
                this.title.label = nls.localize("gestola/explorer/file-navigator-miscFiles", "Misc Files"); 
                break;
            case "file-navigator-rtl-simresults":
                this.title.label = nls.localize("gestola/rtl-level/simulation-results", "Simulation Restults"); 
                break;
        }
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

    protected override renderTailDecorations(node: FileStatNodeData, props: NodeProps): React.ReactNode {
        return  <div className='result-node-buttons-prebuffer'>
                    {this.renderDesignExcludedMarker(node)}
                </div>;
    }

    protected renderDesignExcludedMarker(node: FileStatNodeData): React.ReactNode {
        if(this.projManager.getCurrLLD()?.getRTLModel().designExcludedHDLFiles.find(e => e.isEqual(node.fileStat!.resource)) != undefined){
        return <span className={`result-node-buttons2 ${codicon('debug-breakpoint')}`}></span>;
        } else {
            return ""
        }
    }

}

export function createFileNavigatorContainer(parent: interfaces.Container, opt: GestolaFileNavigatorOptions): Container {

    
    const widget = createFileTreeContainer(parent, {
        tree: FileNavigatorTree,
        model: GestolaFileNavigatorModel,
        widget: GestolaFileNavigatorWidget,
        decoratorService: NavigatorDecoratorService,
        props: {
            ...GESTOLA_FILE_NAVIGATOR_PROPS,
            ...opt 
        },
    });

    return widget;

}

export function createFileNavigatorWidget(parent: interfaces.Container, opt: GestolaFileNavigatorOptions): GestolaFileNavigatorWidget {
    return createFileNavigatorContainer(parent, opt).get(GestolaFileNavigatorWidget);
}

