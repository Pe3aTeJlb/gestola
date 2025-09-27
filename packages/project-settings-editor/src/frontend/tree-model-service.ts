import { ILogger } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ProjectModel } from './tree-model';
import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import {
    projectModelView,
    lowLevelDesignModelView,
    rtlModelView,
    fpgaModelView,
    vlsiModelView,
    projectSchema
} from './tree-schema';
import { JsonSchema7 } from '@jsonforms/core';

@injectable()
export class TreeModelService implements TreeEditor.ModelService {

    constructor(@inject(ILogger) private readonly logger: ILogger) { }

    getDataForNode(node: TreeEditor.Node): void {
        return node.jsonforms.data;
    }

    getSchemaForNode(node: TreeEditor.Node): JsonSchema7 {
        return {
            definitions: projectSchema.definitions,
            ...this.getSubSchemaForNode(node)
        };
    }

    private getSubSchemaForNode(node: TreeEditor.Node): JsonSchema7 | undefined {
        const schema = this.getSchemaForType(node.jsonforms.type);
        if (!schema) {
            // If no schema can be found, let it generate by JsonForms:
            return undefined;
        }
        return schema;
    }

    private getSchemaForType(type: string) {
        if (!type) {
            return undefined;
        }
        return (projectSchema.definitions ? Object.entries(projectSchema.definitions) : [])
            .map(entry => entry[1])
            .find((definition: JsonSchema7) => definition.properties && definition.properties.typeId.const === type);
    }

    getUiSchemaForNode(node: TreeEditor.Node) {
        const type = node.jsonforms.type;
        switch (type) {
            case ProjectModel.Type.ProjectModel:
                return projectModelView;
            case ProjectModel.Type.LowLevelDesignModel:
                return lowLevelDesignModelView;
            case ProjectModel.Type.RTLModel:
                return rtlModelView;
            case ProjectModel.Type.FPGAModel:
                return fpgaModelView;
            case ProjectModel.Type.VLSIModel:
                return vlsiModelView;
            default:
                this.logger.warn("Can't find registered ui schema for type " + type);
                return undefined;
        }
    }

    getChildrenMapping(): Map<string, TreeEditor.ChildrenDescriptor[]> {
        return ProjectModel.childrenMapping;
    }

    getNameForType(type: string): string {
        return ProjectModel.Type.name(type);
    }
}
