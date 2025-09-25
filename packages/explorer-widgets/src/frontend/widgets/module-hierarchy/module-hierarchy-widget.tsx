import React = require('react');
import { injectable, inject, interfaces, Container } from '@theia/core/shared/inversify';
import { URI, nls } from '@theia/core/lib/common';
import { OpenerOptions, OpenerService, SelectableTreeNode, Tree, TreeImpl, TreeWidget, createTreeContainer, defaultTreeProps } from '@theia/core/lib/browser';
import { ContextMenuRenderer, TreeModel, TreeProps } from "@theia/core/lib/browser";
import { ModuleHierarchyTreeImpl, ModuleTreeNode, ModuleTreeRootNode } from './module-hierarchy-tree-impl';
import { ProjectManager } from '@gestola/project-manager';

export const MODULES_HIERARCHY_WIDGET_TREE_PROPS: TreeProps = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: false,
    search: false,
    expandOnlyOnExpansionToggleClick: true,
    leftPadding: 22
};

@injectable()
export class ModuleHierarchyTreeWidget extends TreeWidget {

    static readonly ID = 'gestola:module-hierarchy';
    static readonly VIEW_LABEL = nls.localize("gestola/rtl-level/module-hierarchy", "Module Hierarchy");

    @inject(OpenerService) readonly openerService: OpenerService;

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
        @inject(ProjectManager) readonly projManager: ProjectManager
    ){
    
        super(props, model, contextMenuRenderer);

        this.id = ModuleHierarchyTreeWidget.ID;
        this.title.label = ModuleHierarchyTreeWidget.VIEW_LABEL;

        this.model.root = ModuleTreeRootNode.createRoot();
        
        this.projManager.onDidChangeLLD(() => this.model.refresh());
        this.projManager.onDidChangeDesignTopModule(() => this.model.refresh());
        this.projManager.onDidDesignFilesInclude(() => this.model.refresh());
        this.projManager.onDidDesignFilesExclude(() => this.model.refresh());

    }

    static createContainer(container: interfaces.Container): Container {
        
        const widget = createTreeContainer(container);

        widget.unbind(TreeImpl);
        widget.bind(ModuleHierarchyTreeImpl).toSelf();
        widget.rebind(Tree).toService(ModuleHierarchyTreeImpl);

        widget.unbind(TreeWidget);
        widget.bind(ModuleHierarchyTreeWidget).toSelf();

        widget.rebind(TreeProps).toConstantValue(MODULES_HIERARCHY_WIDGET_TREE_PROPS);

        return widget;

    }

    static createWidget(ctx: interfaces.Container): ModuleHierarchyTreeWidget {
        return ModuleHierarchyTreeWidget.createContainer(ctx).get(ModuleHierarchyTreeWidget);
    }

    protected override tapNode(node?: ModuleTreeNode | undefined): void {
        
        if (node && node.fileDesc && this.corePreferences['workbench.list.openMode'] === 'singleClick') {
            this.open(node.fileDesc.uri, { mode: 'reveal', preview: true });
        }
        if (SelectableTreeNode.is(node)) {
            this.model.selectNode(node);
        }
        if (node && !this.props.expandOnlyOnExpansionToggleClick && this.isExpandable(node)) {
            this.model.toggleNodeExpansion(node);
        }

    }
    async open(uri: URI, options?: OpenerOptions): Promise<object | undefined> {
        const opener = await this.openerService.getOpener(uri, options);
        return opener.open(uri, options);
    }

    protected override renderTree(model: TreeModel): React.ReactNode {
        return super.renderTree(model);
    }

}
