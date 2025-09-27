import { v4 } from 'uuid';
import { ILogger } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ProjectModel } from './tree-model';
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

        switch(data.typeId){
            case "ProjectModel":  
            //this.mapData(data.systemModel, node, 'systemModel');
            data.lowLevelDesignes.forEach((element: any, idx: any) => {
                this.mapData(element, node, 'lowLevelDesignes', idx);
            });
            break;
            case "LowLevelDesignModel":  
            this.mapData(data.rtlModel, node, 'rtlModel');
            data.fpgaModels.forEach((element: any, idx: any) => {
                this.mapData(element, node, 'fpgaModels', idx);
            });
            break;
            case "RTLModel":  ;
            break;
            case "FPGAModel":  ;
            break;
            case "VLSIModel":  ;
            break;
        }

        return node;
    }

    hasCreatableChildren(node: TreeEditor.Node): boolean {
        return node ? ProjectModel.childrenMapping.get(node.jsonforms.type) !== undefined : false;
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
