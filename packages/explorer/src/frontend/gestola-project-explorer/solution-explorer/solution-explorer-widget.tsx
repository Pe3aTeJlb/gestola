import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, NodeProps, Tree, TreeImpl, TreeViewWelcomeWidget, TreeWidget, codicon, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { SolutionExplorerTreeImpl, SolutionTreeNode } from './solution-explorer-tree-impl';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';

export const SOLUTION_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: false,
    leftPadding: 22
};

@injectable()
export class SolutionExplorerWidget extends TreeViewWelcomeWidget {

    static readonly ID = 'gestola-project-manager:solution-explorer';
    static readonly VIEW_LABEL = nls.localize("gestola/explorer/solution-explorer-view-title", "Solution Explorer");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = SolutionExplorerWidget.ID;
        this.title.label = SolutionExplorerWidget.VIEW_LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

        this.projManager.onDidChangeSoltionList(() => this.model.refresh());
		this.projManager.onDidChangeSolution((event) => {
			if(event.solution){
				this.title.label = SolutionExplorerWidget.VIEW_LABEL + ": " + event.solution.solutionName;
			} else {
				this.title.label = SolutionExplorerWidget.VIEW_LABEL;
			}
            this.model.refresh();
		});

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(SolutionExplorerTreeImpl).toSelf();
        widget.rebind(Tree).toService(SolutionExplorerTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(SolutionExplorerWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(SOLUTION_EXPLORER_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): SolutionExplorerWidget {
        return SolutionExplorerWidget.createContainer(ctx).get(SolutionExplorerWidget);
    }

    protected override tapNode(node?: SolutionTreeNode | undefined): void {
        if(node){
            this.projManager.setSolution(node?.solution)
        }
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }


    protected override renderTailDecorations(node: SolutionTreeNode, props: NodeProps): React.ReactNode {
        return  <div className='result-node-buttons-prebuffer'>
                    {this.renderRemoveButton(node)}
                    {this.renderCurrentProjectPointer(node)}
                </div>;
    }

    protected renderRemoveButton(node: SolutionTreeNode): React.ReactNode {
        return <span className={`result-node-buttons1 ${codicon('close')}`} onClick={() => this.projManager.removeSolution([node.solution])}></span>;
    }

    protected renderCurrentProjectPointer(node: SolutionTreeNode): React.ReactNode {
        if(this.projManager.getCurrProject() && this.projManager.getCurrProject()?.getCurrSolution()?.getRootUri() === node.solution.getRootUri()){
            return <span className={`result-node-buttons2 ${codicon('arrow-left')}`}></span>;
        } else {
            return '';
        }
    }

}
