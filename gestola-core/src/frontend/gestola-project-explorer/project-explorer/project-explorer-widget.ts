import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core';
import { CompositeTreeNode, Tree, TreeImpl, TreeWidget, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { ProjectExplorerTreeImpl } from './project-explorer-tree-impl';

export const PROJECT_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: false,
    leftPadding: 22
};

@injectable()
export class ProjectExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola-core:project-explorer';
    static readonly LABEL = nls.localize("gestola-core/gestola-project-explorer/project-explorer", "NLS Doesnt work");

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(TreeModel) readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
    ){

        super(props, model, contextMenuRenderer);
        
        this.id = ProjectExplorerWidget.ID;
        this.title.label = ProjectExplorerWidget.LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: true,
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

}
