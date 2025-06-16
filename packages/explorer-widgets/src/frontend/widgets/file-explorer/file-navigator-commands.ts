import { CommonCommands, codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace FileNavigatorCommands {

    export const REFRESH_NAVIGATOR = Command.toLocalizedCommand({
        id: 'gestola-explorer.refresh',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Refresh in Explorer',
        iconClass: codicon('refresh')
    }, 'theia/navigator/refresh', CommonCommands.FILE_CATEGORY_KEY);

    export const COLLAPSE_ALL = Command.toDefaultLocalizedCommand({
        id: 'gestola-explorer.collapse.all',
        category: CommonCommands.FILE_CATEGORY,
        label: 'Collapse Folders in Explorer',
        iconClass: codicon('collapse-all')
    });

    export const NEW_FILE_TOOLBAR: Command = {
        id: `gestola-explorer.newfile.toolbar`,
        iconClass: codicon('new-file')
    };

    export const NEW_FOLDER_TOOLBAR: Command = {
        id: `gestola-explorer.newfolder.toolbar`,
        iconClass: codicon('new-folder')
    };

    export const DESIGN_FILES_INCLUDE = Command.toLocalizedCommand({
        id: 'gestola-project-manager.include-into-design',
        label: 'Include into Design',
    }, 'gestola/project-manager/include-into-design');

    export const DESIGN_FILES_EXCLUDE = Command.toLocalizedCommand({
        id: 'gestola-project-manager.exclude-from-design',
        label: 'Exclude from Design',
    }, 'gestola/project-manager/exclude-from-design');

    export const DESIGN_SET_TOP_MODULE = Command.toLocalizedCommand({
        id: 'gestola-project-manager.set-as-top-module',
        label: 'Set as Top Module',
    }, 'gestola/project-manager/set-as-top-module');

   
}