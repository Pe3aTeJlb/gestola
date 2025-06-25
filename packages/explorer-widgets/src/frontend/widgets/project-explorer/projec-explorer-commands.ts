import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace ProjectExplorerCommands {

    export const OPEN_GESTOLA_PROJECT = Command.toLocalizedCommand({
        id: 'gestola.project-manager.open-project',
        label: 'Open Gestola Project',
        iconClass: codicon('folder-opened')
    }, 'gestola/project-manager/open-gestola-project');

    export const CREATE_GESTOLA_PROJECT = Command.toLocalizedCommand({
        id: 'gestola.project-manager.create-project',
        label: 'Create Gestola Project',
        iconClass: codicon('file-directory-create')
    }, 'gestola/project-manager/create-gestola-project');

}