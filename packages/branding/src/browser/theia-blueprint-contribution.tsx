import { inject, injectable } from '@theia/core/shared/inversify';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { Command, CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry, MenuPath } from '@theia/core/lib/common/menu';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { nls } from '@theia/core';

export namespace GestolaAboutMenus {
    export const BLUEPRINT_HELP: MenuPath = [...CommonMenus.HELP, 'gestola'];
}
export namespace GestolaAboutCommands {
    export const CATEGORY = 'Blueprint';
    export const REPORT_ISSUE: Command = {
        id: 'gestola:report-issue',
        category: CATEGORY,
        label: nls.localize("gestola/branding/report-issue",'Report Issue')
    };
    export const DOCUMENTATION: Command = {
        id: 'gestola:documentation',
        category: CATEGORY,
        label: nls.localize("gestola/branding/documentation", 'Documentation')
    };
}

@injectable()
export class GestolaContribution implements CommandContribution, MenuContribution {

    @inject(WindowService)
    protected readonly windowService: WindowService;

    static REPORT_ISSUE_URL = 'https://github.com/Pe3aTeJlb/gestola/issues/new/choose';
    static DOCUMENTATION_URL = 'https://www.eclipse.org/cdt-cloud/gestola/wiki';

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(GestolaAboutCommands.REPORT_ISSUE, {
            execute: () => this.windowService.openNewWindow(GestolaContribution.REPORT_ISSUE_URL, { external: true })
        });
        commandRegistry.registerCommand(GestolaAboutCommands.DOCUMENTATION, {
            execute: () => this.windowService.openNewWindow(GestolaContribution.DOCUMENTATION_URL, { external: true })
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(GestolaAboutMenus.BLUEPRINT_HELP, {
            commandId: GestolaAboutCommands.REPORT_ISSUE.id,
            label: GestolaAboutCommands.REPORT_ISSUE.label,
            order: '1'
        });
        menus.registerMenuAction(GestolaAboutMenus.BLUEPRINT_HELP, {
            commandId: GestolaAboutCommands.DOCUMENTATION.id,
            label: GestolaAboutCommands.DOCUMENTATION.label,
            order: '2'
        });
    }
}
