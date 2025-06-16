import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, NodeProps, Tree, TreeImpl, TreeWidget, codicon, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { TestbenchesExplorerTreeImpl, TestbenchTreeNode } from './testbenches-explorer-tree-impl';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';

export const TESTBENCHS_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: true,
    search: false,
    leftPadding: 22
};

@injectable()
export class TestbenchesExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola-project-manager:testbenches-explorer';
    static readonly VIEW_LABEL = nls.localize("gestola/rtl-level/testbenches-explorer-view-title", "TestBenches");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = TestbenchesExplorerWidget.ID;
        this.title.label = TestbenchesExplorerWidget.VIEW_LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

        this.projManager.onDidChangeProject(() => this.model.refresh());
        this.projManager.onDidChangeRTLModel(() => this.model.refresh());
        this.projManager.onDidChangedDesignTopModule(() => this.model.refresh());
        this.projManager.onDidAddTestBench(() => this.model.refresh());
        this.projManager.onDidRemoveTestBench(() => this.model.refresh());
        this.projManager.onDidChangedTestBenches(() => this.model.refresh());

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(TestbenchesExplorerTreeImpl).toSelf();
        widget.rebind(Tree).toService(TestbenchesExplorerTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(TestbenchesExplorerWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(TESTBENCHS_EXPLORER_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): TestbenchesExplorerWidget {
        return TestbenchesExplorerWidget.createContainer(ctx).get(TestbenchesExplorerWidget);
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
