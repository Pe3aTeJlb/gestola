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
import { Command, MaybePromise } from '@theia/core';
import { CompositeTreeNode, DecoratedTreeNode, ExpandableTreeNode, SelectableTreeNode, TreeNode } from '@theia/core/lib/browser/tree';

export namespace TreeEditor {
    export type RootNode = CompositeTreeNode;

    export namespace RootNode {
        export function is(node: TreeNode | undefined): node is RootNode {
            return !!node;
        }
    }

    export interface Node extends CompositeTreeNode, ExpandableTreeNode, SelectableTreeNode, DecoratedTreeNode {
        editorId: string;
        children: TreeNode[];
        name: string;
        jsonforms: {
            type: string;
            property: string;
            index?: string;
            data: any;
        };
    }

    export interface TreeData {
        error: boolean;
        data?: any;
    }

    export namespace Node {
        export function is(node: object | undefined): node is Node {
            return TreeNode.is(node) && 'jsonforms' in node && !!node['jsonforms'];
        }

        export function hasType(node: TreeNode | undefined, type: string): node is Node {
            return is(node) && node.jsonforms.type === type;
        }
    }

    /**
     * Descriptor stating creatable child types for one property in the corresponding parent data.
     */
    export interface ChildrenDescriptor {
        property: string;
        children: string[];
    }

    /**
     * Encapsulates logic to create the tree nodes from the tree's input data.
     */
    export const NodeFactory = Symbol('NodeFactory');
    export interface NodeFactory {
        /**
         * Recursively creates the tree's nodes from the given data.
         *
         * @param treeData The tree's data
         * @returns The tree's shown root nodes (not to confuse with the invisible RootNode)
         */
        mapDataToNodes(treeData: TreeData): MaybePromise<Node[]>;

        /**
         * Creates the corresponding TreeNode for the given data.
         *
         * @param data The instance data to map to a tree node
         * @param parent The created node's parent node
         * @param property The JSON property which this node's data is contained in
         * @param indexOrKey If the data is inserted in an array property, this is the index it is inserted at.
         *           If the data is inserted into an object, this is the key the data is associated with.
         */
        mapData(data: any, parent?: Node, property?: string, indexOrKey?: number | string): MaybePromise<Node>;

        /**
         * @param node The node to create a child for
         * @returns true if child nodes can be created
         */
        hasCreatableChildren(node: Node): boolean;
    }

    export interface AddCommandDescription {
        parentType: string;
        property: string;
        type: string;
        command: Command;
    }

    /**
     * Information to get the icon of an add command from an editor's label provider contribution.
     */
    export interface CommandIconInfo {
        _id: 'theia-tree-editor-command-icon-info';
        editorId: string;
        type: string;
    }

    export namespace CommandIconInfo {
        export function is(info: object | undefined): info is CommandIconInfo {
            return !!info && '_id' in info && 'theia-tree-editor-command-icon-info' === info['_id'];
        }
    }
}
