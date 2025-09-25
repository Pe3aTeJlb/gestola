import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, NodeProps, SelectableTreeNode, Tree, TreeImpl, TreeNode, TreeSelection, TreeWidget, codicon, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { TestBenchExplorerTreeImpl, TestbenchTreeNode } from './testbenches-explorer-tree-impl';
import { ProjectManager } from '@gestola/project-manager';
import { TESTBENCHES_EXPLORER_CONTEXT_MENU } from './testbenches-explorer-commands-contribution';

export const TESTBENCHS_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    contextMenuPath: TESTBENCHES_EXPLORER_CONTEXT_MENU,
    multiSelect: true,
    search: false,
    leftPadding: 22
};

@injectable()
export class TestBenchExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola:testbenches-explorer';
    static readonly VIEW_LABEL = nls.localize("gestola/rtl-level/testbenches-explorer-view-title", "TestBenches");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = TestBenchExplorerWidget.ID;
        this.title.label = TestBenchExplorerWidget.VIEW_LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

        this.projManager.onDidChangeProject(() => this.model.refresh());
        this.projManager.onDidChangeLLD(() => this.model.refresh());
        this.projManager.onDidChangeDesignTopModule(() => this.model.refresh());
        this.projManager.onDidAddTestBench(() => this.model.refresh());
        this.projManager.onDidRemoveTestBench(() => this.model.refresh());

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(TestBenchExplorerTreeImpl).toSelf();
        widget.rebind(Tree).toService(TestBenchExplorerTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(TestBenchExplorerWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(TESTBENCHS_EXPLORER_WIDGET_TREE_PROPS);

        return widget;

    }

    protected override handleContextMenuEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement, MouseEvent>): void {
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
                    args: [this, args]
                }), 10);
            }
        }
        event.stopPropagation();
        event.preventDefault();
    }

    static createWidget(ctx: interfaces.Container): TestBenchExplorerWidget {
        return TestBenchExplorerWidget.createContainer(ctx).get(TestBenchExplorerWidget);
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }

    protected override renderTailDecorations(node: TestbenchTreeNode, props: NodeProps): React.ReactNode {
        return  <div className='result-node-buttons-prebuffer'>
                    {this.renderRemoveButton(node)}
                </div>;
    }

    protected renderRemoveButton(node: TestbenchTreeNode): React.ReactNode {
        return <span className={`result-node-buttons1 ${codicon('close')}`}></span>;
    }

}
