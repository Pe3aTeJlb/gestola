import { injectable } from 'inversify';
import { Command, CommandRegistry, MenuModelRegistry } from '@theia/core/lib/common';
import { OpenFpgaLoaderWidget } from './openfpgaloader-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';

export const OpenFpgaLoaderCommand: Command = { id: 'openfpgaloader:open', label: 'Open FPGA Programmer' };

@injectable()
export class OpenFpgaLoaderContribution extends AbstractViewContribution<OpenFpgaLoaderWidget> {

    /**
     * `AbstractViewContribution` handles the creation and registering
     *  of the widget including commands, menus, and keybindings.
     * 
     * We can pass `defaultWidgetOptions` which define widget properties such as 
     * its location `area` (`main`, `left`, `right`, `bottom`), `mode`, and `ref`.
     * 
     */
    constructor() {
        super({
            widgetId: OpenFpgaLoaderWidget.ID,
            widgetName: OpenFpgaLoaderWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
            toggleCommandId: OpenFpgaLoaderCommand.id
        });
    }

    /**
     * Example command registration to open the widget from the menu, and quick-open.
     * For a simpler use case, it is possible to simply call:
     ```ts
        super.registerCommands(commands)
     ```
     *
     * For more flexibility, we can pass `OpenViewArguments` which define 
     * options on how to handle opening the widget:
     * 
     ```ts
        toggle?: boolean
        activate?: boolean;
        reveal?: boolean;
     ```
     *
     * @param commands
     */
    override registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(OpenFpgaLoaderCommand, {
            execute: () => super.openView({ activate: true})
        });
    }

    /**
     * Example menu registration to contribute a menu item used to open the widget.
     * Default location when extending the `AbstractViewContribution` is the `View` main-menu item.
     * 
     * We can however define new menu path locations in the following way:
     ```ts
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: 'id',
            label: 'label'
        });
     ```
     * 
     * @param menus
     */
     override registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
    }
}
