import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, Tree, TreeImpl, TreeViewWelcomeWidget, TreeWidget, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { ProjectExplorerTreeImpl, ProjectTreeItem } from './project-explorer-tree-impl';
import { ProjectManager } from '../../project-manager/project-manager';

export const PROJECT_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: false,
    leftPadding: 22
};

@injectable()
export class ProjectExplorerWidget extends TreeViewWelcomeWidget {

    static readonly ID = 'gestola-core:project-explorer';
    static readonly LABEL = nls.localize("gestola-core/gestola-project-explorer/project-explorer", "NLS Doesnt work");

    @inject(ProjectManager)
    private readonly projManager: ProjectManager;

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(TreeModel) readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
    ){

        super(props, model, contextMenuRenderer);
        console.log("nls test2", nls.locale, nls.localization, nls.localize("a", "NLS Doesnt work"));
        this.id = ProjectExplorerWidget.ID;
        this.title.label = ProjectExplorerWidget.LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

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

    protected override tapNode(node?: ProjectTreeItem | undefined): void {
        if(node){
            this.projManager.setProject(node?.project)
        }
    }

}
