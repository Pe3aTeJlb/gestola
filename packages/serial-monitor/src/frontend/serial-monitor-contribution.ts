import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { CommandContribution } from '@theia/core/lib/common/command';
import { SerialMonitorClient } from './serial-monitor-client';

export const SerialMonitorOpen: Command = { id: 'serial-monitor:openSerial', label: 'Open Serial Monitor' };
export const SerialMonitorChangeBaudrate: Command = { id: 'serial-monitor:changeBaudrate', label: 'Change Baud Rate' };

@injectable()
export class SerialMonitorContribution implements CommandContribution {

    @inject(SerialMonitorClient)
    private readonly serialManager: SerialMonitorClient;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(SerialMonitorOpen, {
            execute: async () => {
                await this.serialManager.openSerial();
            }
        });
        commands.registerCommand(SerialMonitorChangeBaudrate, {
            execute: () => this.serialManager.write("test string")
        });
    }

}
