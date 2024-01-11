import { injectable, inject } from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService } from '@theia/core/lib/common';
import { CommonMenus } from '@theia/core/lib/browser';

export const GestolaCoreCommand: Command = {
    id: 'GestolaCore.command',
    label: 'Say Hello'
};

@injectable()
export class GestolaCoreCommandContribution implements CommandContribution {

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
    ) { }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(GestolaCoreCommand, {
            execute: () => this.messageService.info('Hello World!')
        });
    }
}

@injectable()
export class GestolaCoreMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: GestolaCoreCommand.id,
            label: GestolaCoreCommand.label
        });
    }
}
