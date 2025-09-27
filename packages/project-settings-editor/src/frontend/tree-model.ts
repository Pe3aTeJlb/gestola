import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';

export namespace ProjectModel {
    export namespace Type {
        export const ProjectModel = 'ProjectModel';
        export const SystemModel = 'SystemModel';
        export const LowLevelDesignModel = 'LowLevelDesignModel';
        export const RTLModel = 'RTLModel';
        export const FPGAModel = 'FPGAModel';
        export const VLSIModel = 'VLSIModel';

        export function name(type: string): string {
            return type;
        }
    }

    export const childrenMapping: Map<string, TreeEditor.ChildrenDescriptor[]> = new Map([
        [
            Type.ProjectModel, [
                {
                    property: 'lowLevelDesignes',
                    children: [Type.LowLevelDesignModel]
                }
            ]
        ],
        [
            Type.LowLevelDesignModel, [
                {
                    property: 'fpgaModels',
                    children: [Type.FPGAModel]
                },
                {
                    property: 'vlsiModels',
                    children: [Type.VLSIModel]
                }
            ]
        ]
    ]);

}