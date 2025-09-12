import { injectable } from '@theia/core/shared/inversify';
import { MenuModelRegistry } from '@theia/core';
import { SerialMonitorWidget } from './serial-monitor-widget';
import { AbstractViewContribution, codicon } from '@theia/core/lib/browser';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { nls } from '@theia/core/lib/common';

export const SerialMonitorCommand: Command = { id: 'serial-monitor:command', label: 'Open Serial Monitor' };

export namespace SerialMonitor {
  export namespace Commands {
    export const AUTOSCROLL = Command.toLocalizedCommand(
      {
        id: 'serial-monitor-autoscroll',
        label: 'Autoscroll',
        iconClass: codicon("fold-down")
      },
      'gestola/serial-monitor/autoscroll'
    );
    export const TIMESTAMP = Command.toLocalizedCommand(
      {
        id: 'serial-monitor-timestamp',
        label: 'Timestamp',
        iconClass: codicon('watch')
      },
      'gestola/serial-monitor/timestamp'
    );
    export const CLEAR_OUTPUT = Command.toLocalizedCommand(
      {
        id: 'serial-monitor-clear-output',
        label: 'Clear Output',
        iconClass: codicon('clear-all'),
      },
      'vscode/output.contribution/clearOutput.label'
    );
  }
}

@injectable()
export class SerialMonitorWidgetContribution extends AbstractViewContribution<SerialMonitorWidget> implements TabBarToolbarContribution {

    static readonly TOGGLE_SERIAL_MONITOR = SerialMonitorWidget.ID + ':toggle';
    static readonly TOGGLE_SERIAL_MONITOR_TOOLBAR = SerialMonitorWidget.ID + ':toggle-toolbar';
    static readonly RESET_SERIAL_MONITOR = SerialMonitorWidget.ID + ':reset';

    constructor() {
        super({
            widgetId: SerialMonitorWidget.ID,
            widgetName: SerialMonitorWidget.LABEL,
            defaultWidgetOptions: { area: 'bottom' },
            toggleCommandId: SerialMonitorCommand.id
        });
    }
    
    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
          id:  SerialMonitor.Commands.AUTOSCROLL.id,
          isVisible: (widget) => widget instanceof SerialMonitorWidget,
          command: SerialMonitor.Commands.AUTOSCROLL.id
        });
        registry.registerItem({
          id: SerialMonitor.Commands.TIMESTAMP.id,
          isVisible: (widget) => widget instanceof SerialMonitorWidget,
          command: SerialMonitor.Commands.TIMESTAMP.id
        });
        registry.registerItem({
          id: SerialMonitor.Commands.CLEAR_OUTPUT.id,
          command: SerialMonitor.Commands.CLEAR_OUTPUT.id,
          isVisible: (widget) => widget instanceof SerialMonitorWidget,
          tooltip: nls.localize(
            'vscode/output.contribution/clearOutput.label',
            'Clear Output'
          )
        });
      }
   
    override registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(SerialMonitorCommand, {
            execute: () => super.openView({ activate: true})
        });
        commands.registerCommand(SerialMonitor.Commands.CLEAR_OUTPUT, {
          isEnabled: (widget) => widget instanceof SerialMonitorWidget,
          isVisible: (widget) => widget instanceof SerialMonitorWidget,
          execute: (widget) => {
            if (widget instanceof SerialMonitorWidget) {
              widget.clearConsole();
            }
          },
        });
        commands.registerCommand(SerialMonitor.Commands.AUTOSCROLL, {
          isEnabled: (widget) => widget instanceof SerialMonitorWidget,
          isVisible: (widget) => widget instanceof SerialMonitorWidget,
          execute: (widget) => {
            if (widget instanceof SerialMonitorWidget) {
              widget.toggleAutoscroll();
            }
          },
        });
        commands.registerCommand(SerialMonitor.Commands.TIMESTAMP, {
          isEnabled: (widget) => widget instanceof SerialMonitorWidget,
          isVisible: (widget) => widget instanceof SerialMonitorWidget,
          execute: (widget) => {
            if (widget instanceof SerialMonitorWidget) {
              widget.toggleTimestamp();
            }
          },
        });
    }

     override registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
    }

}
