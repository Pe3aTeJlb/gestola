import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { LLDTemplate, LLDTemplateContribution } from '../common/protocol';

@injectable()
export class GestolaLLDTemplateContribution implements LLDTemplateContribution {
    get templates(): LLDTemplate[] {
        return [
        {
            id: "gestola-lld-empty-template",
            label: 'Empty Template',
            resourcesPath: new URI(__dirname).resolve('../../resources/lld_templates/empty').normalizePath().toString()
        },
        ];
    }
}
