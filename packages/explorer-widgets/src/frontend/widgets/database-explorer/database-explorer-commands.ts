import { codicon } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common';

export namespace ModulesHieararchyCommands {

    export const REFRESH_DATABASE_EXPLORER = Command.toLocalizedCommand({
        id: 'gestola.database-explorer.refresh',
        label: 'Refrash',
        iconClass: codicon('refresh')
    }, 'gestola/project-manager/set-as-top-module');

}