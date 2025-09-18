import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common';
import { CompositeTreeNode, Tree, TreeImpl, TreeWidget, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { DatasetSelectorTreeImpl, TableTreeNode } from './dataset-selector-tree-impl';
import { Event, Emitter } from "@theia/core";

export const DATASET_SELECTOR_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: true,
    leftPadding: 22
};

@injectable()
export class DatasetSelectorWidget extends TreeWidget {

    static readonly ID = 'gestola:dataset-selector';
    static readonly VIEW_LABEL = nls.localize("gestola/analytics/database-explorer", "nalytics Database Explorer");

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager,
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = DatasetSelectorWidget.ID;
        this.title.label = DatasetSelectorWidget.VIEW_LABEL;

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
        widget.bind(DatasetSelectorTreeImpl).toSelf();
        widget.rebind(Tree).toService(DatasetSelectorTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(DatasetSelectorWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(DATASET_SELECTOR_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): DatasetSelectorWidget {
        return DatasetSelectorWidget.createContainer(ctx).get(DatasetSelectorWidget);
    }

    protected override handleDblClickEvent(node?: CompositeTreeNode | undefined): void {
        if(node && 'columns' in node){
            this.fireTaleSelectEvent((node as TableTreeNode).name!);
        }
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }

    

    protected readonly onDidCheckedChangeEmitter = new Emitter<TableSelectEvent>();
    get onDidTableSelect(): Event<TableSelectEvent> {
		return this.onDidCheckedChangeEmitter.event;
	}
    private fireTaleSelectEvent(table: string){
        this.onDidCheckedChangeEmitter.fire({table: table} as TableSelectEvent);
    }

}

export interface TableSelectEvent {
    readonly table: string;
}