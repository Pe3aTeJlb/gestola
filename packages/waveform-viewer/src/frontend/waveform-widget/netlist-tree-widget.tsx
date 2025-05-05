/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 *******************************************************************************/
import { Event, Emitter, MenuPath } from "@theia/core";
import { codicon, Message } from '@theia/core/lib/browser';
import { ExpandableTreeNode, SelectableTreeNode, TreeModel } from '@theia/core/lib/browser';
import { ContextMenuRenderer } from '@theia/core/lib/browser/context-menu-renderer';
import { CompositeTreeNode, TreeNode } from '@theia/core/lib/browser/tree/tree';
import { TreeProps, TreeWidget } from '@theia/core/lib/browser/tree/tree-widget';
import { inject, injectable, postConstruct } from 'inversify';
import { TreeEditor } from '../tree-editor-widget/interfaces';
import { NetlistId, NetlistItem, SignalId } from '../../common/netlist-dto';
import React from 'react';
import { v4 } from 'uuid';

export namespace TreeContextMenu {
    export const CONTEXT_MENU: MenuPath = ['theia-tree-editor-tree-context-menu'];
    export const ADD_MENU: MenuPath = ['theia-tree-editor-tree-add-menu'];
}

@injectable()
export class NetlistTreeWidget extends TreeWidget {

    protected onTreeWidgetSelectionEmitter = new Emitter<readonly Readonly<TreeEditor.Node>[]>();

    constructor(
        @inject(TreeProps) override readonly props: TreeProps,
        @inject(TreeModel) override readonly model: TreeModel,
        @inject(ContextMenuRenderer) override readonly contextMenuRenderer: ContextMenuRenderer,
    ) {

        super(props, model, contextMenuRenderer);

        this.id = NetlistTreeWidget.WIDGET_ID;
        this.title.label = NetlistTreeWidget.WIDGET_LABEL;
        this.title.caption = NetlistTreeWidget.WIDGET_LABEL;

        model.root = {
            id: NetlistTreeWidget.WIDGET_ID,
            name: NetlistTreeWidget.WIDGET_LABEL,
            parent: undefined,
            visible: false,
            children: []
        } as CompositeTreeNode;
    }

    @postConstruct()
    protected override init(): void {
        super.init();

        this.toDispose.push(this.onTreeWidgetSelectionEmitter);
        this.toDispose.push(
            this.model.onSelectionChanged(e => {
                this.onTreeWidgetSelectionEmitter.fire(e as readonly Readonly<TreeEditor.Node>[]);
            })
        );
    }

    protected override tapNode(node?: NetTreeNode | undefined): void {
        
        if (SelectableTreeNode.is(node)) {
            this.model.selectNode(node);
        }
        if (node && !this.props.expandOnlyOnExpansionToggleClick && this.isExpandable(node)) {
            this.model.toggleNodeExpansion(node);
        }

    }

    protected override toggleChecked(event: React.MouseEvent<HTMLElement>): void {
        const nodeId = event.currentTarget.getAttribute('data-node-id');
        if (nodeId) {
            const node = this.model.getNode(nodeId);
            if (node) {
                this.model.markAsChecked(node, !node.checkboxInfo!.checked);
                this.fireCheckedChangedEvent(node as NetTreeNode, node.checkboxInfo!.checked);
            } else {
                this.handleClickEvent(node, event);
            }
        }
        event.preventDefault();
        event.stopPropagation();
    }

    protected override handleEnter(event: KeyboardEvent): void {
        this.filterSelectedNodes(this.model.selectedNodes);
    }

    protected override handleSpace(event: KeyboardEvent): void {
        this.filterSelectedNodes(this.model.selectedNodes);
    }

    private filterSelectedNodes(nodes: readonly TreeNode[]) {
        let arr: TreeNode[] = nodes.slice();
        let modules = arr.filter((e: ModuleTreeNode) => e.type == 'module');
        let filteredModules = modules.filter(e => !this.isChildren(e, modules));
        let filteredSelection = arr.filter(e => {
            if(filteredModules.includes(e)){ 
                return true;
            } else if (filteredModules.length > 0){
                return !this.isChildren(e, filteredModules);
            } else {
                return true;
            }
        });
        this.markNodes(filteredSelection, undefined);
    }

    
    private isChildren(node: TreeNode, modules: TreeNode[]): boolean {

        if(modules.length == 0) return false;

        if(node.parent){
            if(modules.includes(node.parent)){
                return true;
            } else {
                return this.isChildren(node.parent, modules);
            }
        }

        return false;
    }

    protected override onCloseRequest(msg: Message): void {
        this.dispose();
    }

    private markNodes(nodes: readonly TreeNode[], value: boolean | undefined){
        nodes.forEach((e: TreeNode) => {
            if(e.checkboxInfo) {
                if(value !== undefined){
                    this.model.markAsChecked(e, value);
                    this.fireCheckedChangedEvent(e as NetTreeNode, value);
                } else {
                    this.model.markAsChecked(e, !e.checkboxInfo.checked);
                    this.fireCheckedChangedEvent(e as NetTreeNode, e.checkboxInfo!.checked);
                }
            } else if(value != undefined){
                this.markNodes((e as CompositeTreeNode).children, value);
            } else {
                if(this.findChecked((e as CompositeTreeNode).children)){
                    this.markNodes((e as CompositeTreeNode).children, false);
                } else {
                    this.markNodes((e as CompositeTreeNode).children, true);
                }
            }
        });
    }

    private findChecked(nodes: readonly TreeNode[]): boolean {

        if(!nodes || nodes.length == 0) return false;

        for(let e of nodes){
            if(e.checkboxInfo) {
                if(e.checkboxInfo.checked == true) {
                    return true;
                }
            } else if(this.findChecked((e as CompositeTreeNode).children)) {
                return true;
            }
        }

        return false;

    }
    
    public async setData(data: NetlistItem[]): Promise<void> {
        let nodes = this.netlistToTreeItem(data, this.model.root);
        nodes.sort((a: NetTreeNode, b: NetTreeNode) => {
            if(a.type == 'module' && b.type != 'module'){
                return 1;
            } else if(a.name && b.name){
                return a.name.localeCompare(b.name);
            } else {
                return 0
            }
        });
        (this.model.root as CompositeTreeNode).children = nodes;
        this.model.refresh();
    }



    private netlistToTreeItem(data: NetlistItem[], parent: TreeNode | undefined): NetTreeNode[]{

        let arr: NetTreeNode[] = []

        for(let d of data){

            let node;

            if(d.type == 'module'){
                node = {
                    id: v4(),
                    parent: parent,
                    name: d.name,
                    description: d.description,
                    icon: codicon(d.iconId),
                    type: d.type,
                    encoding: d.encoding,
                    signalId: d.signalId,
                    netlistId: d.netlistId,
                    width: d.width,
                    modulePath: d.modulePath,
                    numberFormat: d.numberFormat,
                    msb: d.msb,
                    lsb: d.lsb,
                    selected: false,
                    expanded: false,
                    visible: true,
                } as ModuleTreeNode;
                node.children = this.netlistToTreeItem(d.children, node);
            } else {
                node = {
                    id: v4(),
                    parent: parent,
                    name: d.name,
                    description: d.description,
                    icon: codicon(d.iconId),
                    type: d.type,
                    encoding: d.encoding,
                    signalId: d.signalId,
                    netlistId: d.netlistId,
                    width: d.width,
                    modulePath: d.modulePath,
                    numberFormat: d.numberFormat,
                    msb: d.msb,
                    lsb: d.lsb,
                    selected: false,
                    expanded: false,
                    visible: true, 
                    checkboxInfo: {checked: false}
                } as NetTreeNode;
            }

            arr.push(node);

        }

        return arr;

    }

    protected readonly onDidCheckedChangeEmitter = new Emitter<CheckedChangedEvent>();
    get onDidChangeCheckedState(): Event<CheckedChangedEvent> {
		return this.onDidCheckedChangeEmitter.event;
	}
    private fireCheckedChangedEvent(node: NetTreeNode, change: boolean){
        this.onDidCheckedChangeEmitter.fire({node: node, change: change} as CheckedChangedEvent);
    }

    protected override renderIcon(node: TreeNode): React.ReactNode {
        return (
            <div className="tree-icon-container">
                <div className={this.labelProvider.getIcon(node)} />
            </div>
        );
    }

}

export interface CheckedChangedEvent {
    readonly node: NetTreeNode;
    readonly change: boolean;
}

// eslint-disable-next-line no-redeclare
export namespace NetlistTreeWidget {
    export const WIDGET_ID = 'theia-tree-editor-tree';
    export const WIDGET_LABEL = 'Theia Tree Editor - Tree';
}

export interface ModuleTreeNode extends CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode {
    numberFormat: string;
    type: string;
    encoding:   string,
    width:      number,
    signalId:   SignalId,
    netlistId:  NetlistId,
    modulePath: string,
    msb:        number,
    lsb:        number
}

export interface NetTreeNode extends TreeNode, SelectableTreeNode, ExpandableTreeNode {
    numberFormat: string;
    type: string;
    encoding:   string,
    width:      number,
    signalId:   SignalId,
    netlistId:  NetlistId,
    modulePath: string,
    msb:        number,
    lsb:        number
}