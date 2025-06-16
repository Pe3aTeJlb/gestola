import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace RTLModelExplorerCommands {

    export const CREATE_RTL_MODEL = Command.toLocalizedCommand({
        id: 'gestola-project-manager.create-rtl-model',
        label: 'Create RTL Model',
        iconClass: codicon('file-directory-create')
    }, 'gestola/project-manager/create-rtl-model');

}