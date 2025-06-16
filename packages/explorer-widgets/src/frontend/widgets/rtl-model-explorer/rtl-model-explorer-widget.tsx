import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, NodeProps, Tree, TreeImpl, TreeWidget, codicon, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { RTLModelExplorerTreeImpl, RTLModelTreeNode } from './rtl-model-explorer-tree-impl';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';

export const RTL_MODEL_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: false,
    leftPadding: 22
};

@injectable()
export class RTLModelExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola-project-manager:rtl-model-explorer';
    static readonly VIEW_LABEL = nls.localize("gestola/explorer/rtl-model-explorer-view-title", "RTL Models Explorer");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = RTLModelExplorerWidget.ID;
        this.title.label = RTLModelExplorerWidget.VIEW_LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

        this.projManager.onDidChangeRTLModelList(() => this.model.refresh());
		this.projManager.onDidChangeRTLModel((event) => {
			if(event.model){
				this.title.label = RTLModelExplorerWidget.VIEW_LABEL + ": " + event.model.rtlModelName;
			} else {
				this.title.label = RTLModelExplorerWidget.VIEW_LABEL;
			}
            this.model.refresh();
		});

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(RTLModelExplorerTreeImpl).toSelf();
        widget.rebind(Tree).toService(RTLModelExplorerTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(RTLModelExplorerWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(RTL_MODEL_EXPLORER_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): RTLModelExplorerWidget {
        return RTLModelExplorerWidget.createContainer(ctx).get(RTLModelExplorerWidget);
    }

    protected override tapNode(node?: RTLModelTreeNode | undefined): void {
        if(node){
            this.projManager.setRTLModel(node?.model)
        }
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }


    protected override renderTailDecorations(node: RTLModelTreeNode, props: NodeProps): React.ReactNode {
        return  <div className='result-node-buttons-prebuffer'>
                    {this.renderRemoveButton(node)}
                    {this.renderCurrentProjectPointer(node)}
                </div>;
    }

    protected renderRemoveButton(node: RTLModelTreeNode): React.ReactNode {
        return <span className={`result-node-buttons1 ${codicon('trash')}`} onClick={() => this.projManager.removeRTLModel([node.model])}></span>;
    }

    protected renderCurrentProjectPointer(node: RTLModelTreeNode): React.ReactNode {
        if(this.projManager.getCurrProject() && this.projManager.getCurrProject()?.getCurrRTLModel()?.getRootUri() === node.model.getRootUri()){
            return <span className={`result-node-buttons2 ${codicon('arrow-left')}`}></span>;
        } else {
            return '';
        }
    }

}
