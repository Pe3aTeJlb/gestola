import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { SolutionTemplate } from '../common/protocol';

@injectable()
export class GestolaSolutionTemplateContribution implements GestolaSolutionTemplateContribution {
    get templates(): SolutionTemplate[] {
        return [
        {
            id: "gestola-solution-empty-template",
            label: 'Empty Template',
            resourcesPath: new URI(__dirname).resolve('../../resources/solution_templates/empty').normalizePath().toString()
        },
        ];
    }
}
