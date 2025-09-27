import { injectable } from '@theia/core/shared/inversify';
import { LabelProviderContribution } from '@theia/core/lib/browser';
import { ProjectModel } from './tree-model';
import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { ProjectSettingsEditorWidget } from './project-settings-editor';


const DEFAULT_COLOR = 'black';

const ICON_CLASSES: Map<string, string> = new Map([
    [ProjectModel.Type.ProjectModel, 'fa-folder ' + DEFAULT_COLOR],
    [ProjectModel.Type.SystemModel, 'fa-code ' + DEFAULT_COLOR],
    [ProjectModel.Type.LowLevelDesignModel, 'fa-cubes ' + DEFAULT_COLOR],
    [ProjectModel.Type.RTLModel, 'fa-code ' + DEFAULT_COLOR],
    [ProjectModel.Type.FPGAModel, 'fa-microchip  ' + DEFAULT_COLOR],
    [ProjectModel.Type.VLSIModel, 'fa-microchip ' + DEFAULT_COLOR],
]);

/* Icon for unknown types */
const UNKNOWN_ICON = 'fa-sitemap ' + DEFAULT_COLOR;

@injectable()
export class TreeLabelProvider implements LabelProviderContribution {

    public canHandle(element: object): number {
        if ((TreeEditor.Node.is(element) || TreeEditor.CommandIconInfo.is(element))
            && element.editorId === ProjectSettingsEditorWidget.ID) {
            return 1000;
        }
        return 0;
    }

    public getIcon(element: object): string | undefined {
        let iconClass: string | undefined;
        if (TreeEditor.CommandIconInfo.is(element)) {
            iconClass = ICON_CLASSES.get(element.type);
        } else if (TreeEditor.Node.is(element)) {
            iconClass = ICON_CLASSES.get(element.jsonforms.type);
        }

        return iconClass ? 'fa ' + iconClass : 'fa ' + UNKNOWN_ICON;
    }

    public getName(element: any): string | undefined {
        const data = TreeEditor.Node.is(element) ? element.jsonforms.data : element;
        if (element.name) {
            return element.name;
        } else if (data.typeId) {
            return this.getTypeName(data.typeId);
        }
        return undefined;
    }

    private getTypeName(typeId: string): string {
        return ProjectModel.Type.name(typeId);
    }
}
