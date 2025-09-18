import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, Tree, TreeImpl, TreeWidget, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { DatabaseExplorerTreeImpl } from './database-explorer-tree-impl';

export const DATABASE_EXPLORER_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: true,
    leftPadding: 22
};

@injectable()
export class DatabaseExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola:database-explorer';
    static readonly VIEW_LABEL = nls.localize("gestola/analytics/database-explorer", "Analytics Database Explorer");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = DatabaseExplorerWidget.ID;
        this.title.label = DatabaseExplorerWidget.VIEW_LABEL;

        const root: CompositeTreeNode = {
            id: "dummy-root",
            name: "dummy-root",
            visible: false,
            parent: undefined,
            children: [],
        }
        this.model.root = root;

        this.projManager.onDidChangeProjectList(() => this.model.refresh());
		this.projManager.onDidChangeProjectFavoriteStatus(() => this.model.refresh());
		this.projManager.onDidChangeProject(() => this.model.refresh());

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(DatabaseExplorerTreeImpl).toSelf();
        widget.rebind(Tree).toService(DatabaseExplorerTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(DatabaseExplorerWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(DATABASE_EXPLORER_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): DatabaseExplorerWidget {
        return DatabaseExplorerWidget.createContainer(ctx).get(DatabaseExplorerWidget);
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }

}
