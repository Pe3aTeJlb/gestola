import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace ConstrainsExplorerCommands {

    export const REFRESH_EXPLORER = Command.toLocalizedCommand({
        id: 'gestola.constrains-explorer.refresh',
        label: 'Refresh Explorer',
        iconClass: codicon('refresh')
    }, 'theia/navigator/refresh');

    export const COLLAPSE_ALL = Command.toDefaultLocalizedCommand({
        id: 'gestola.constrains-explorer.collapse-all',
        label: 'Collapse All',
        iconClass: codicon('collapse-all')
    });

    export const NEW_CONSTAINS_FILE: Command = {
        id: `gestola.constrains-explorer.newfile`,
        label: 'New Constrains File',
        iconClass: codicon('new-file')
    };

    export const NEW_CONSTRAINS_SET: Command = {
        id: `gestola.constrains-explorer.newfolder`,
        label: 'New Set',
        iconClass: codicon('new-folder')
    }


    
    export const CONSTRAINS_FILE_USE_NONE = Command.toLocalizedCommand({
        id: `gestola.constrains-explorer.use-none`,
        label: 'Do not use',
        iconClass: codicon('new-folder')
    }, 'gestola/project-manager/include-into-design');

    export const CONSTRAINS_FILE_USE_SYNTH = Command.toLocalizedCommand({
        id: `gestola.constrains-explorer.use-synth`,
        label: 'Use in Synthesis',
        iconClass: codicon('new-folder')
    }, 'gestola/project-manager/include-into-design');

    export const CONSTRAINS_FILE_USE_IMPL = Command.toLocalizedCommand({
        id: `gestola.constrains-explorer.use-impl`,
        label: 'Use in Implementation',
        iconClass: codicon('new-folder')
    }, 'gestola/project-manager/include-into-design');

    export const CONSTRAINS_FILE_USE_SYNTH_IMPL = Command.toLocalizedCommand({
        id: `gestola.constrains-explorer.use-synth-impl`,
        label: 'Use in Synthesis & Implementation',
        iconClass: codicon('new-folder')
    }, 'gestola/project-manager/include-into-design');

}