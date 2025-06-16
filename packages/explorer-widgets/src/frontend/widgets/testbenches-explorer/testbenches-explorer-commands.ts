import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace TestbenchesExplorerCommands {

    export const TESTBENCHES_ADD = Command.toLocalizedCommand({
        id: 'gestola-project-manager.testbenches-add',
        label: 'Add to testbenches',
        iconClass: codicon('file-directory-create')
    }, 'gestola/project-manager/testbenches-add');

    export const TESTBENCHES_REMOVE = Command.toLocalizedCommand({
        id: 'gestola-project-manager.testbenches-remove',
        label: 'Remove from testbenches',
        iconClass: codicon('file-directory-create')
    }, 'gestola/project-manager/testbenches-remove');

    export const REFRESH_TESTBENCHES = Command.toLocalizedCommand({
        id: 'gestola-project-manager.refresh-testbenches',
        label: 'Refrash',
        iconClass: codicon('refresh')
    }, 'gestola/project-manager/set-as-top-module');

}