import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace DatasetSelectorCommands {

    export const REFRESH_DATASET_SELECTOR = Command.toLocalizedCommand({
        id: 'gestola.dataset-selector.refresh',
        label: 'Refrash',
        iconClass: codicon('refresh')
    }, 'gestola/project-manager/set-as-top-module');

}