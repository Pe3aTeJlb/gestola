import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, NodeProps, Tree, TreeImpl, TreeWidget, codicon, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { LLDExplorerTreeImpl, LLDTreeNode } from './lld-explorer-tree-impl';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';

export const LLD_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: false,
    leftPadding: 22
};

@injectable()
export class LLDExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola:lld-model-explorer';
    static readonly VIEW_LABEL = nls.localize("gestola/explorer/lld-explorer-view-title", "Low Level Desgines Explorer");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = LLDExplorerWidget.ID;
        this.title.label = LLDExplorerWidget.VIEW_LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

        this.projManager.onDidChangeLLDList(() => this.model.refresh());
		this.projManager.onDidChangeLLD((event) => {
			if(event.lld){
				this.title.label = LLDExplorerWidget.VIEW_LABEL + ": " + event.lld.lldName;
			} else {
				this.title.label = LLDExplorerWidget.VIEW_LABEL;
			}
            this.model.refresh();
		});

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(LLDExplorerTreeImpl).toSelf();
        widget.rebind(Tree).toService(LLDExplorerTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(LLDExplorerWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(LLD_EXPLORER_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): LLDExplorerWidget {
        return LLDExplorerWidget.createContainer(ctx).get(LLDExplorerWidget);
    }

    protected override tapNode(node?: LLDTreeNode | undefined): void {
        if(node){
            this.projManager.setLowLevelDesign(node?.model)
        }
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }


    protected override renderTailDecorations(node: LLDTreeNode, props: NodeProps): React.ReactNode {
        return  <div className='result-node-buttons-prebuffer'>
                    {this.renderRemoveButton(node)}
                    {this.renderCurrentProjectPointer(node)}
                </div>;
    }

    protected renderRemoveButton(node: LLDTreeNode): React.ReactNode {
        return <span className={`result-node-buttons1 ${codicon('trash')}`} onClick={() => this.projManager.removeLowLevelDesign([node.model])}></span>;
    }

    protected renderCurrentProjectPointer(node: LLDTreeNode): React.ReactNode {
        if(this.projManager.getCurrProject() && this.projManager.getCurrProject()?.getCurrLLD()?.getRootUri() === node.model.getRootUri()){
            return <span className={`result-node-buttons2 ${codicon('arrow-left')}`}></span>;
        } else {
            return '';
        }
    }

}
