import * as React from 'react';
import { Title } from '@lumino/widgets';
import { BaseWidget, Message, Saveable, SplitPanel, Widget } from '@theia/core/lib/browser';
import { ILogger } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { inject, injectable, postConstruct } from 'inversify';
import { debounce, isEqual } from 'lodash';
import { createRoot } from 'react-dom/client';
import { AddCommandProperty, DetailFormWidget, MasterTreeWidget, TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { ProjectManager } from '@gestola/project-manager';


@injectable()
export abstract class ProjectSettingsEditorWidget extends BaseWidget {

    static readonly ID = 'project-setting:widget';
    static readonly LABEL = 'Gestola: Project Settings';
    
    private splitPanel: SplitPanel;

    public selectedNode: TreeEditor.Node | undefined;
    protected instanceData: any;

    constructor(
        @inject(MasterTreeWidget)
        readonly treeWidget: MasterTreeWidget,
        @inject(DetailFormWidget)
        readonly formWidget: DetailFormWidget,
        @inject(WorkspaceService)
        readonly workspaceService: WorkspaceService,
        @inject(ILogger) readonly logger: ILogger,
        @inject(TreeEditor.NodeFactory)
        protected readonly nodeFactory: TreeEditor.NodeFactory,
        @inject(ProjectManager)
        readonly projManager: ProjectManager,
    ) {
        super();
        this.id = ProjectSettingsEditorWidget.ID;
        this.splitPanel = new SplitPanel();
        this.addClass(ProjectSettingsEditorWidget.Styles.EDITOR);
        this.splitPanel.addClass(ProjectSettingsEditorWidget.Styles.SASH);
        this.treeWidget.addClass(ProjectSettingsEditorWidget.Styles.TREE);
        this.formWidget.addClass(ProjectSettingsEditorWidget.Styles.FORM);
        this.formWidget.onChange(
            debounce(data => {
                if (!this.selectedNode || !this.selectedNode.jsonforms || isEqual(this.selectedNode.jsonforms.data, data)) {
                    return;
                }
                this.handleFormUpdate(data, this.selectedNode);
            }, 250)
        );
        this.toDispose.push(this.treeWidget.onSelectionChange(ev => this.treeSelectionChanged(ev)));
        this.toDispose.push(this.treeWidget.onDelete(node => this.deleteNode(node)));
        this.toDispose.push(this.treeWidget.onAdd(addProp => this.addNode(addProp)));
    }

    @postConstruct()
    protected init(): void {
        this.configureTitle(this.title);
        this.setTreeData(false);
    }

    createSnapshot(): Saveable.Snapshot {
        const state = JSON.stringify(this.instanceData);
        return { value: state };
    }

    applySnapshot(snapshot: { value: string }): void {
        this.instanceData = JSON.parse(snapshot.value);
    }

    protected getTypeProperty() {
        return "typeId";
    }

    protected setTreeData(error: boolean): Promise<void> {
        const treeData: TreeEditor.TreeData = {
            error,
            data: this.projManager.getCurrProject()
        };
        return this.treeWidget.setData(treeData);
    }

    async revert(options?: Saveable.RevertOptions): Promise<void> {
        throw new Error('Method revert needs to be overriden by implementor of BaseTreeEditorWiget');
    }

    protected override onResize(_msg: any): void {
        if (this.splitPanel) {
            this.splitPanel.update();
        }
    }

    protected renderError(errorMessage: string): void {
        const root = createRoot(this.formWidget.node);
        root.render(<React.Fragment>{errorMessage}</React.Fragment>);
    }

    protected treeSelectionChanged(selectedNodes: readonly Readonly<TreeEditor.Node>[]): void {
        if (selectedNodes.length === 0) {
            this.selectedNode = undefined;
        } else {
            this.selectedNode = selectedNodes[0];
            this.formWidget.setSelection(this.selectedNode);
        }
        this.update();
    }

    protected async deleteNode(node: Readonly<TreeEditor.Node>): Promise<void> {
        if (node.parent && TreeEditor.Node.is(node.parent)) {
            const propertyData = node.parent.jsonforms.data[node.jsonforms.property];
            if (Array.isArray(propertyData)) {
                propertyData.splice(Number(node.jsonforms.index), 1);
                // eslint-disable-next-line no-null/no-null
            } else if (propertyData !== null && typeof propertyData === 'object') {
                propertyData[node.jsonforms.index!] = undefined;
            } else {
                this.logger.error(
                    `Could not delete node's data from its parent's property ${node.jsonforms.property}. Property data:`,
                    propertyData
                );
                return;
            }

            // Data was changed in place but need to trigger tree updates.
            await this.treeWidget.updateDataForSubtree(node.parent, node.parent.jsonforms.data);
        }
    }

    protected async addNode({ node, type, property }: AddCommandProperty): Promise<void> {
        // Create an empty object that only contains its type identifier
        const newData: { [k: string]: any } = {};
        newData[this.getTypeProperty()] = type;

        // TODO handle children not being stored in an array

        if (!node.jsonforms.data[property]) {
            node.jsonforms.data[property] = [];
        }
        node.jsonforms.data[property].push(newData);
        await this.treeWidget.updateDataForSubtree(node, node.jsonforms.data);
    }

    protected override onAfterAttach(msg: Message): void {
        this.splitPanel.addWidget(this.treeWidget);
        this.splitPanel.addWidget(this.formWidget);
        this.splitPanel.setRelativeSizes([1, 4]);
        Widget.attach(this.splitPanel, this.node);
        this.treeWidget.activate();
        super.onAfterAttach(msg);
    }

    protected override onActivateRequest(): void {
        if (this.splitPanel) {
            this.splitPanel.node.focus();
        }
    }

    protected async handleFormUpdate(data: any, node: TreeEditor.Node): Promise<void> {
        await this.treeWidget.updateDataForSubtree(node, data);
    }

    /**
     * Configure this editor's title tab by configuring the given Title object.
     *
     * @param title The title object configuring this editor's title tab in Theia
     */
    protected configureTitle(title: Title<Widget>): void{
        title.label = this.projManager.getCurrProject()!.projName;
        title.caption = this.projManager.getCurrProject()!.projName;
        title.closable = true;
    }
}

// eslint-disable-next-line no-redeclare
export namespace ProjectSettingsEditorWidget {

    export namespace Styles {
        export const EDITOR = 'theia-tree-editor';
        export const TREE = 'theia-tree-editor-tree';
        export const FORM = 'theia-tree-editor-form';
        export const SASH = 'theia-tree-editor-sash';
    }
}
