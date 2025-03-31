import { injectable, inject } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { VerilatorFrontendService } from './verilator-service';
import { VerilatorCommands } from './verilator-commands';
import { CommonMenus } from '@theia/core/lib/browser';

@injectable()
export class VerilatorCommandContribution implements CommandContribution, MenuContribution {

    @inject(VerilatorFrontendService)
    protected readonly verilatorService: VerilatorFrontendService;

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(VerilatorCommands.RUN_SIMULATION, {
            execute: () =>  this.verilatorService.runVerilator()
        });

    }

    registerMenus(menus: MenuModelRegistry): void {

        menus.registerMenuAction(CommonMenus.FILE_AUTOSAVE, {
            commandId: VerilatorCommands.RUN_SIMULATION.id,
            label: VerilatorCommands.RUN_SIMULATION.label,
            order: 'a'
        });

    }

}
