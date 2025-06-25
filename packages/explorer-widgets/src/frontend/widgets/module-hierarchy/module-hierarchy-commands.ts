import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace ModulesHieararchyCommands {

    export const REFRESH_MODULES_HIERARCHY = Command.toLocalizedCommand({
        id: 'gestola.modules-hierarchy.refresh',
        label: 'Refrash Modules Hierarchy',
        iconClass: codicon('refresh')
    }, 'gestola/project-manager/set-as-top-module');

}