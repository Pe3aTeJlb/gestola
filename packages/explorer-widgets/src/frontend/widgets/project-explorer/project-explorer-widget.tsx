import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, NodeProps, Tree, TreeImpl, TreeViewWelcomeWidget, TreeWidget, codicon, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { ProjectExplorerTreeImpl, ProjectTreeNode } from './project-explorer-tree-impl';
import { ProjectManager } from '@gestola/project-manager';

export const PROJECT_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: false,
    leftPadding: 22
};

@injectable()
export class ProjectExplorerWidget extends TreeViewWelcomeWidget {

    static readonly ID = 'gestola:project-explorer';
    static readonly MENU_LABEL = nls.localize("gestola/explorer/view-container-title", "Gestola: Projects Explorer")
    static readonly VIEW_LABEL = nls.localize("gestola/explorer/project-explorer-view-title", "Project Explorer");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = ProjectExplorerWidget.ID;
        this.title.label = ProjectExplorerWidget.VIEW_LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

        this.projManager.onDidChangeProjectList(() => this.model.refresh());
		this.projManager.onDidChangeProjectFavoriteStatus(() => this.model.refresh())
		this.projManager.onDidChangeProject((event) => {
			if(event.proj){
				this.title.label = ProjectExplorerWidget.VIEW_LABEL + ": " + event.proj.name;
			} else {
				this.title.label = ProjectExplorerWidget.VIEW_LABEL;
			}
            this.model.refresh();
		});

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(ProjectExplorerTreeImpl).toSelf();
        widget.rebind(Tree).toService(ProjectExplorerTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(ProjectExplorerWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(PROJECT_EXPLORER_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): ProjectExplorerWidget {
        return ProjectExplorerWidget.createContainer(ctx).get(ProjectExplorerWidget);
    }

    protected override tapNode(node?: ProjectTreeNode | undefined): void {
        if(node){
            this.projManager.setProject(node?.project);
        }
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        if (this.model.root && this.projManager.getProjectsCount() === 0) {
            return this.renderViewWelcome();
        }
        return super.renderTree(model);
    }

    protected override renderViewWelcome(): React.ReactNode {
        return (
            <div className='theia-navigator-container'>
            <div className='center'>{nls.localize("gestola-project-manager/gestola-project-explorer/view-welcome", "You have not yet created project")}</div>
            <div className='open-workspace-button-container'>
                <button className='theia-button open-workspace-button'
                    onClick={() => this.projManager.createProject()}>
                    {nls.localize("gestola/explorer/create-project", "Create Project")}
                </button>
            </div>
            <div className='open-workspace-button-container'>
                <button className='theia-button open-workspace-button'
                    onClick={() => this.projManager.openProject()}>
                    {nls.localize("gestola/explorer/open-project", "Open Project")}
                </button>
            </div>
        </div>
        );
    }


    protected override renderTailDecorations(node: ProjectTreeNode, props: NodeProps): React.ReactNode {
        return  <div className='result-node-buttons-prebuffer'>
                    {this.renderSetFavoriteButton(node)}
                    {this.renderRemoveButton(node)}
                    {this.renderCurrentProjectPointer(node)}
                </div>;
    }

    protected renderSetFavoriteButton(node: ProjectTreeNode): React.ReactNode {
        if(node.project.isFavorite){
            return <span className={`result-node-buttons2 ${codicon('star-full')}`} onClick={() => this.projManager.setFavorite(node.project)}></span>
        } else {
            return <span className={`result-node-buttons1 ${codicon('star-add')}`} onClick={() => this.projManager.setFavorite(node.project)}></span>
        }
    }

    protected renderRemoveButton(node: ProjectTreeNode): React.ReactNode {
        return <span className={`result-node-buttons1 ${codicon('close')}`} onClick={() => this.projManager.removeProject([node.project])}></span>;
    }

    protected renderCurrentProjectPointer(node: ProjectTreeNode): React.ReactNode {
        if(this.projManager.getCurrProject() && this.projManager.getCurrProject()?.uri === node.project.uri){
            return <span className={`result-node-buttons2 ${codicon('arrow-left')}`}></span>;
        } else {
            return '';
        }
    }

}
