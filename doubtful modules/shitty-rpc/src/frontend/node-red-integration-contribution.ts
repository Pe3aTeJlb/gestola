import { injectable } from '@theia/core/shared/inversify';
import { MenuModelRegistry } from '@theia/core';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';

export const NodeRedIntegrationCommand: Command = { id: 'node-red-integration:command', label: 'Node RED' };

@injectable()
export class NodeRedIntegrationContribution extends AbstractViewContribution<NodeRedIntegrationWidget> {

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
            widgetId: NodeRedIntegrationWidget.ID,
            widgetName: NodeRedIntegrationWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
            toggleCommandId: NodeRedIntegrationCommand.id
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
        commands.registerCommand(NodeRedIntegrationCommand, {
            execute: () => super.openView({ activate: false, reveal: true })
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