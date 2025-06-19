import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace ConstrainsExplorerCommands {

    export const TESTBENCHES_ADD_BY_URI = Command.toLocalizedCommand({
        id: 'gestola-project-manager.testbenches-add-by-uri',
        label: 'Add to testbenches',
        iconClass: codicon('add')
    }, 'gestola/project-manager/testbenches-add');

    export const TESTBENCHES_REMOVE_BY_URI = Command.toLocalizedCommand({
        id: 'gestola-project-manager.testbenches-remove-by-uri',
        label: 'Remove from testbenches',
        iconClass: codicon('remove')
    }, 'gestola/project-manager/testbenches-remove');

    

    export const TESTBENCHES_REMOVE = Command.toLocalizedCommand({
        id: 'gestola-project-manager.testbenches-remove',
        label: 'Remove from testbenches',
        iconClass: codicon('remove')
    }, 'gestola/project-manager/testbenches-remove');



    export const TESTBENCHES_RUN_SIMULATION_SELECTED = Command.toLocalizedCommand({
        id: 'gestola-project-manager.testbenches-run-simulation-single',
        label: 'Run simulation',
        iconClass: codicon('run')
    }, 'gestola/project-manager/testbenches-remove');

    export const TESTBENCHES_RUN_SIMULATION_ALL = Command.toLocalizedCommand({
        id: 'gestola-project-manager.testbenches-run-simulation-all',
        label: 'Run all',
        iconClass: codicon('run-all')
    }, 'gestola/project-manager/testbenches-remove');



    export const REFRESH_TESTBENCHES = Command.toLocalizedCommand({
        id: 'gestola-project-manager.refresh-testbenches',
        label: 'Refrash',
        iconClass: codicon('refresh')
    }, 'gestola/project-manager/set-as-top-module');

}