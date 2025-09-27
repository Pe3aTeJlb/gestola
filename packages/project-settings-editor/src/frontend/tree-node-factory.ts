import { v4 } from 'uuid';
import { ILogger } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
//import { ProjectModel } from './tree-model';
import { TreeLabelProvider } from './tree-label-provider';
import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { ProjectSettingsEditorWidget } from './project-settings-editor';

@injectable()
export class TreeNodeFactory implements TreeEditor.NodeFactory {

    constructor(
        @inject(TreeLabelProvider) private readonly labelProvider: TreeLabelProvider,
        @inject(ILogger) private readonly logger: ILogger) {
    }

    mapDataToNodes(treeData: TreeEditor.TreeData): TreeEditor.Node[] {
        const node = this.mapData(treeData.data);
        if (node) {
            return [node];
        }
        return [];
    }

    mapData(
        data: any, 
        parent?: TreeEditor.Node, 
        property?: string, 
        indexOrKey?: number | string
    ): TreeEditor.Node {

        if (!data) {
            this.logger.warn('mapData called without data');
        }

        const node: TreeEditor.Node = {
            ...this.defaultNode(),
            editorId: ProjectSettingsEditorWidget.ID,
            name: this.labelProvider.getName(data) ?? '',
            parent: parent,
            jsonforms: {
                type: this.getTypeId(data),
                data: data,
                property: property ?? '',
                index: typeof indexOrKey === 'number' ? indexOrKey.toFixed(0) : indexOrKey
            }
        };

        // containments
        if (parent) {
            parent.children.push(node);
            parent.expanded = true;
        }

        if(data.typeId == "ProjectModel"){

            this.mapData(data.systemModel, node, 'systemModel');
            
            const fakeSubRoot = {
                ...this.defaultNode(),
                editorId: ProjectSettingsEditorWidget.ID,
                name: "Low Level Designes",
                parent: parent,
            };

            data.lowLevelDesignes.forEach((element: any, idx: any) => {
                this.mapData(element, fakeSubRoot, 'lowLevelDesignes', idx);
            });

            if (node) {
                node.children.push(fakeSubRoot);
                node.expanded = true;
            }

        }

        if(data.typeId == "LowLevelDesignModel"){

            this.mapData(data.rtlModel, node, 'rtlModel');

            const fakeSubRoot = {
                ...this.defaultNode(),
                editorId: ProjectSettingsEditorWidget.ID,
                name: "FPGA Models",
                parent: parent,
            };

            data.fpgaModels.forEach((element: any, idx: any) => {
                this.mapData(element, fakeSubRoot, 'fpgaModels', idx);
            });

            const fakeSubRoot2 = {
                ...this.defaultNode(),
                editorId: ProjectSettingsEditorWidget.ID,
                name: "VLSI Models",
                parent: parent,
            };

            data.vlsiModels.forEach((element: any, idx: any) => {
                this.mapData(element, fakeSubRoot2, 'vlsiModels', idx);
            });

            if (node) {
                node.children.push(fakeSubRoot, fakeSubRoot2);
                node.expanded = true;
            }

        }

        return node;
    }

    hasCreatableChildren(node: TreeEditor.Node): boolean {
        //return node ? ProjectModel.childrenMapping.get(node.jsonforms.type) !== undefined : false;
        return false;
    }

    protected defaultNode(): Omit<TreeEditor.Node, 'editorId'> {
        return {
            id: v4(),
            expanded: false,
            selected: false,
            parent: undefined,
            children: [],
            decorationData: {},
            name: '',
            jsonforms: {
                type: '',
                property: '',
                data: undefined
            }
        };
    }

    /** Derives the type id from the given data. */
    protected getTypeId(data: any): string {
        return data && data.typeId || '';
    }

}
