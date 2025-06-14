import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace ProjectManagerCommands {

    export const OPEN_GESTOLA_PROJECT = Command.toLocalizedCommand({
        id: 'gestola-project-manager.open-project',
        label: 'Open Gestola Project',
        iconClass: codicon('folder-opened')
    }, 'gestola/project-manager/open-gestola-project');

    export const CREATE_GESTOLA_PROJECT = Command.toLocalizedCommand({
        id: 'gestola-project-manager.create-project',
        label: 'Create Gestola Project',
        iconClass: codicon('file-directory-create')
    }, 'gestola/project-manager/create-gestola-project');



    export const CREATE_RTL_MODEL = Command.toLocalizedCommand({
        id: 'gestola-project-manager.create-rtl-model',
        label: 'Create RTL Model',
        iconClass: codicon('file-directory-create')
    }, 'gestola/project-manager/create-rtl-model');



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

    export const REFRESH_MODULES_HIERARCHY = Command.toLocalizedCommand({
        id: 'gestola-project-manager.refresh-modules-hierarchy',
        label: 'Refrash Modules Hierarchy',
        iconClass: codicon('refresh')
    }, 'gestola/project-manager/set-as-top-module');
   
}