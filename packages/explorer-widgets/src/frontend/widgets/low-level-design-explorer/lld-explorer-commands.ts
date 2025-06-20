import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace LLDExplorerCommands {

    export const CREATE_LLD = Command.toLocalizedCommand({
        id: 'gestola-project-manager.create-lld',
        label: 'Create Low Level Design',
        iconClass: codicon('file-directory-create')
    }, 'gestola/project-manager/create-low-level-design');

}