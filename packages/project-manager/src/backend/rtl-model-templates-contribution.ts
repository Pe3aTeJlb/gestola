import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { RTLModelTemplate, RTLModelTemplateContribution } from '../common/protocol';

@injectable()
export class GestolaRTLModelTemplateContribution implements RTLModelTemplateContribution {
    get templates(): RTLModelTemplate[] {
        return [
        {
            id: "gestola-rtl-model-empty-template",
            label: 'Empty Template',
            resourcesPath: new URI(__dirname).resolve('../../resources/rtlmodel_templates/empty').normalizePath().toString()
        },
        ];
    }
}
