import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileNode, FileTreeModel } from '@theia/filesystem/lib/browser';
import { OpenerService, open, TreeNode, ExpandableTreeNode, CompositeTreeNode, SelectableTreeNode } from '@theia/core/lib/browser';
import { FileNavigatorTree, WorkspaceRootNode, WorkspaceNode } from '@theia/navigator/lib/browser/navigator-tree';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { ProgressService } from '@theia/core/lib/common/progress-service';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { Disposable } from '@theia/core/lib/common/disposable';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { SelectionService } from '@theia/core';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser';

@injectable()
export class GestolaFileNavigatorModel extends FileTreeModel {

    @inject(OpenerService) protected readonly openerService: OpenerService;
    @inject(FileNavigatorTree) protected override readonly tree: FileNavigatorTree;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(FrontendApplicationStateService) protected readonly applicationState: FrontendApplicationStateService;
    @inject(ProjectManager) protected projManager: ProjectManager;
    @inject(SelectionService) protected selService: SelectionService;
    
    @inject(ProgressService)
    protected readonly progressService: ProgressService;

    @inject(WorkspaceCommandContribution)
    protected readonly workspaceCommandContribution: WorkspaceCommandContribution;

    protected rootId: string | undefined;
    get navigatorId(): string | undefined {
        return this.rootId;
    }
    set navigatorId(id: string | undefined) {
        this.rootId = id;
    }

    protected rootUri: URI | undefined;
    get rootURI(): URI | undefined {
        return this.rootUri;
    }

    
    @postConstruct()
    protected override init(): void {
        super.init();
        this.reportBusyProgress();
        this.initializeRoot();
    }

    protected readonly pendingBusyProgress = new Map<string, Deferred<void>>();
    protected reportBusyProgress(): void {
        this.toDispose.push(this.onDidChangeBusy(node => {
            const pending = this.pendingBusyProgress.get(node.id);
            if (pending) {
                if (!node.busy) {
                    pending.resolve();
                    this.pendingBusyProgress.delete(node.id);
                }
                return;
            }
            if (node.busy) {
                const progress = new Deferred<void>();
                this.pendingBusyProgress.set(node.id, progress);
                this.progressService.withProgress('', 'explorer', () => progress.promise);
            }
        }));
        this.toDispose.push(Disposable.create(() => {
            for (const pending of this.pendingBusyProgress.values()) {
                pending.resolve();
            }
            this.pendingBusyProgress.clear();
        }));
    }

    protected async initializeRoot(): Promise<void> {
        await Promise.all([
            this.applicationState.reachedState('initialized_layout'),
            this.workspaceService.roots
        ]);
        await this.updateRoot();
        if (this.toDispose.disposed) {
            return;
        }
        this.toDispose.push(this.workspaceCommandContribution.onDidCreateNewFolder(() => {
            this.refresh();
        }));
        this.toDispose.push(this.workspaceCommandContribution.onDidCreateNewFile(() => {
            this.refresh();
        }));
       
        this.toDispose.push(this.workspaceService.onWorkspaceChanged(() => {
            this.refresh();
        }));
        this.toDispose.push(this.workspaceService.onWorkspaceLocationChanged(() => {
            this.refresh()
        }));
        this.toDispose.push(this.projManager.onDidChangeProjectList(() => {
            this.updateRoot(); 
            //this.refresh()
        }));
        this.toDispose.push(this.projManager.onDidChangeProject(() => {
            this.updateRoot(); 
            //this.refresh()
        }));
        this.toDispose.push(this.projManager.onDidChangeRTLModel(() => {
            this.updateRoot(); 
            //this.refresh()
        }));


        this.selectionService.onSelectionChanged(() => {
            this.applySelection();
        });

        if (this.selectedNodes.length) {
            return;
        }
        const root = this.root;
        if (CompositeTreeNode.is(root) && root.children.length === 1) {
            const child = root.children[0];
            if (SelectableTreeNode.is(child) && !child.selected && ExpandableTreeNode.is(child)) {
                this.selectNode(child);
                this.expandNode(child);
            }
        }
    }

    applySelection(): void {
        if(this.selectedNodes.length > 0){
            this.selService.selection = this.selectedNodes;
        } else if(this.rootURI) {
            this.selService.selection = [this.root as SelectableTreeNode];
        }
    }

    previewNode(node: TreeNode): void {
        if (FileNode.is(node)) {
            open(this.openerService, node.uri, { mode: 'reveal', preview: true });
        }
    }

    protected override doOpenNode(node: TreeNode): void {
        if (node.visible === false) {
            return;
        } else if (FileNode.is(node)) {
            open(this.openerService, node.uri);
        } else {
            super.doOpenNode(node);
        }
    }

    override *getNodesByUri(uri: URI): IterableIterator<TreeNode> {
        const workspace = this.root;
        if (WorkspaceNode.is(workspace)) {
            for (const root of workspace.children) {
                const id = this.tree.createId(root, uri);
                const node = this.getNode(id);
                if (node) {
                    yield node;
                }
            }
        }
    }

    protected async updateRoot(): Promise<void> {
        this.root = await this.createRoot();
        if (CompositeTreeNode.is(this.root) && this.root.children.length === 1) {
            const child = this.root.children[0];
            if (SelectableTreeNode.is(child) && !child.selected && ExpandableTreeNode.is(child)) {
                this.selectNode(child);
                this.expandNode(child);
            }
        }
    }

    protected async createRoot(): Promise<TreeNode | undefined> {
        let proj = this.projManager.getCurrProject();
        let lld = this.projManager.getCurrProject()?.getCurrRTLModel();
        if(proj){

            if(this.rootId === "file-navigator-system" || this.rootId === "file-navigator-misc"){

                const treeRoot = WorkspaceNode.createRoot();

                let rootFolder;
                switch(this.rootId){
                    case "file-navigator-system": 
                    rootFolder = await proj.systemFolderFStat();
                    break;
                    case "file-navigator-misc": 
                    rootFolder = await proj.miscFolderFStat();
                    break;
                }

                if(rootFolder && rootFolder.children){
                    this.rootUri = rootFolder.resource;
                    treeRoot.children.push(
                        await this.tree.createWorkspaceRoot(rootFolder, treeRoot)
                    );
                }

                return treeRoot;

            } else if (lld){

                const treeRoot = WorkspaceNode.createRoot();

                let rootFolder;
                switch(this.rootId){      
                    
                    case "file-navigator-rtl":
                        rootFolder = await lld.rtlFolderFStat();
                        break;
                    case "file-navigator-fpga": 
                        rootFolder = await lld.fpgaFolderFStat();
                        break;
                    case "file-navigator-vlsi": 
                        rootFolder = await lld.vlsiFolderFStat();
                        break;
                    case "simresults": 
                        rootFolder = await lld.simuResultsFolderFStat();
                        break;
                
                }

                if(rootFolder && rootFolder.children){
                    this.rootUri = rootFolder.resource;
                    treeRoot.children.push(
                        await this.tree.createWorkspaceRoot(rootFolder, treeRoot)
                    );
                }

                return treeRoot;

            }

        }

    }

    /**
     * Create multiple root node used to display
     * the multiple root workspace name.
     *
     * @returns `WorkspaceNode`
     */
    protected createMultipleRootNode(): WorkspaceNode {
        const workspace = this.workspaceService.workspace;
        let name = workspace
            ? workspace.resource.path.name
            : 'untitled';
        name += ' (Workspace)';
        return WorkspaceNode.createRoot(name);
    }

    /**
     * Move the given source file or directory to the given target directory.
     */
    override async move(source: TreeNode, target: TreeNode): Promise<URI | undefined> {
        if (source.parent && WorkspaceRootNode.is(source)) {
            // do not support moving a root folder
            return undefined;
        }
        return super.move(source, target);
    }

    /**
     * Reveals node in the navigator by given file uri.
     *
     * @param uri uri to file which should be revealed in the navigator
     * @returns file tree node if the file with given uri was revealed, undefined otherwise
     */
    async revealFile(uri: URI): Promise<TreeNode | undefined> {
        if (!uri.path.isAbsolute) {
            return undefined;
        }
        let node = this.getNodeClosestToRootByUri(uri);

        // success stop condition
        // we have to reach workspace root because expanded node could be inside collapsed one
        if (WorkspaceRootNode.is(node)) {
            if (ExpandableTreeNode.is(node)) {
                if (!node.expanded) {
                    node = await this.expandNode(node);
                }
                return node;
            }
            // shouldn't happen, root node is always directory, i.e. expandable
            return undefined;
        }

        // fail stop condition
        if (uri.path.isRoot) {
            // file system root is reached but workspace root wasn't found, it means that
            // given uri is not in workspace root folder or points to not existing file.
            return undefined;
        }

        if (await this.revealFile(uri.parent)) {
            if (node === undefined) {
                // get node if it wasn't mounted into navigator tree before expansion
                node = this.getNodeClosestToRootByUri(uri);
            }
            if (ExpandableTreeNode.is(node) && !node.expanded) {
                node = await this.expandNode(node);
            }
            return node;
        }
        return undefined;
    }

    protected getNodeClosestToRootByUri(uri: URI): TreeNode | undefined {
        const nodes = [...this.getNodesByUri(uri)];
        return nodes.length > 0
            ? nodes.reduce((node1, node2) => // return the node closest to the workspace root
                node1.id.length >= node2.id.length ? node1 : node2
            ) : undefined;
    }
}
