import { inject, injectable } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser';
import { Command, CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { MenuModelRegistry, MenuContribution } from '@theia/core/lib/common/menu';
import { MenuPath } from "@theia/core";
import { WaveformWidget } from './waveform-widget';
import { NetlistData } from './waveform/helper';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
  
export const WAVEFORM_VIEWER_CONTEXT_MENU: MenuPath = ['waveform-viewer-context-menu'];
export namespace WaveformViewerContextMenu {

    export const FORMAT_SUBMENU = [...WAVEFORM_VIEWER_CONTEXT_MENU, 'format_values'];
    export const FORMAT_BINARY = [...FORMAT_SUBMENU, 'binary'];
    export const FORMAT_HEX = [...FORMAT_SUBMENU, 'hex']
    export const FORMAT_OCTAL = [...FORMAT_SUBMENU, 'octal'];
    export const FORMAT_DECIMAL_UNSIGN = [...FORMAT_SUBMENU, 'decimal_unsign'];
    export const FORMAT_DECIMAL_SIGN = [...FORMAT_SUBMENU, 'decimal_sign'];
    export const FORMAT_FLOAT = [...FORMAT_SUBMENU, 'float'];
    export const FORMAT_ASCII = [...FORMAT_SUBMENU, 'ascii'];

    export const COLOR_SUBMENU = [...WAVEFORM_VIEWER_CONTEXT_MENU, 'color'];
    export const COLOR_1 = [...COLOR_SUBMENU, 'color_1'];
    export const COLOR_2 = [...COLOR_SUBMENU, 'color_2'];
    export const COLOR_3 = [...COLOR_SUBMENU, 'color_3'];
    export const COLOR_4 = [...COLOR_SUBMENU, 'color_4'];

    export const RENDER_SUBMENU = [...WAVEFORM_VIEWER_CONTEXT_MENU, 'render_submenu'];
    export const MULTI_BIT = [...RENDER_SUBMENU, 'multi_bit'];
    export const LINEAR = [...RENDER_SUBMENU, 'linear'];
    export const STEPPED = [...RENDER_SUBMENU, 'stepped'];
    export const LINEAR_SIGN = [...RENDER_SUBMENU, 'linear_sign'];
    export const STEPPED_SIGN = [...RENDER_SUBMENU, 'stepped_sign'];

    export const COPY_SIGNAL = [...WAVEFORM_VIEWER_CONTEXT_MENU, 'copy_signal'];
    export const COPY_VALUE = [...WAVEFORM_VIEWER_CONTEXT_MENU, 'copy_value'];
    export const REMOVE = [...WAVEFORM_VIEWER_CONTEXT_MENU, 'remove'];

}

export namespace WaveformViewerCommands {

    export const FORMAT_BINARY = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.format_binary',
        label: 'Binary',
    });

    export const FORMAT_HEX = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.format_hex',
        label: 'HEX',
    });

    export const FORMAT_OCTAL = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.format_octal',
        label: 'Octal',
    });

    export const FORMAT_DECIMAL_SIGN = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.format_decimal_sign',
        label: 'Decimal (Signed)',
    });

    export const FORMAT_DECIMAL_UNSIGN = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.format_decimal_unsign',
        label: 'Decimal (Unsigned)',
    });

    export const FORMAT_FLOAT = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.format_float',
        label: 'Floating Point',
    });

    export const FORMAT_ASCII = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.format_ascii',
        label: 'ASCII',
    });


    
    export const COLOR_1 = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.color_1',
        label: 'Color 1',
    });

    export const COLOR_2 = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.color_2',
        label: 'Color 2',
    });

    export const COLOR_3 = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.color_3',
        label: 'Color 3',
    });

    export const COLOR_4 = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.color_4',
        label: 'Color 4',
    });



    export const RENDER_MULTI_BIT = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.multi_bit',
        label: 'Multi Bit',
    });

    export const RENDER_LINEAR = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.linear',
        label: 'Linear',
    });

    export const RENDER_STEPPED = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.stepped',
        label: 'Stepped',
    });

    export const RENDER_LINEAR_SIGN = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.linear_sign',
        label: 'Linear Sign',
    });

    export const RENDER_STEPPED_SIGN= Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.stepped_sign',
        label: 'Stepped Sign',
    });


    export const COPY_SIGNAL = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.copy_signal',
        label: 'Copy Signal',
    });

    export const COPY_VALUE = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.copy_value',
        label: 'Copy Value',
    });

    export const REMOVE = Command.toLocalizedCommand({
        id: 'gestola-waveform-viewer.remove',
        label: 'Remove Signal',
    });
  
}

@injectable()
export class WaveformViewerContextMenuContribution implements CommandContribution, MenuContribution {

    @inject(ClipboardService)
    protected readonly clipboard: ClipboardService;

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(WaveformViewerCommands.FORMAT_BINARY, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            isVisible:(widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, "binary", undefined, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.FORMAT_HEX, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, "hexadecimal", undefined, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.FORMAT_OCTAL, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, "octal", undefined, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.FORMAT_DECIMAL_SIGN, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) =>  widget.setValueFormat(id, "signed", undefined, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.FORMAT_DECIMAL_UNSIGN, {
            isEnabled:(widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            isVisible:(widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, "decimal", undefined, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.FORMAT_FLOAT, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth == 8 || attrs.signalWidth == 16 || attrs.signalWidth == 32 || attrs.signalWidth == 64),
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth == 8 || attrs.signalWidth == 16 || attrs.signalWidth == 32 || attrs.signalWidth == 64),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) =>  {
                switch (attrs.signalWidth) {
                    case 8:  widget.setValueFormat(id, "float8",  undefined, undefined); break;
                    case 16: widget.setValueFormat(id, "float16", undefined, undefined); break;
                    case 32: widget.setValueFormat(id, "float32", undefined, undefined); break;
                    case 64: widget.setValueFormat(id, "float64", undefined, undefined); break;
                    default: widget.setValueFormat(id, "binary",  undefined, undefined); break;
                }
            }
        });

        commands.registerCommand(WaveformViewerCommands.FORMAT_ASCII, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth % 7 == 0,
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth % 7 == 0,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, "ascii", undefined, undefined)
        });



        commands.registerCommand(WaveformViewerCommands.COLOR_1, {
            isEnabled: widget => this.withWaveformViewerWidget(widget, () => true),
            isVisible: widget => this.withWaveformViewerWidget(widget, () => true),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, 0, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.COLOR_2, {
            isEnabled: widget => this.withWaveformViewerWidget(widget, () => true),
            isVisible: widget => this.withWaveformViewerWidget(widget, () => true),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, 1, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.COLOR_3, {
            isEnabled: widget => this.withWaveformViewerWidget(widget, () => true),
            isVisible: widget => this.withWaveformViewerWidget(widget, () => true),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, 2, undefined)
        });

        commands.registerCommand(WaveformViewerCommands.COLOR_4, {
            isEnabled: widget => this.withWaveformViewerWidget(widget, () => true),
            isVisible: widget => this.withWaveformViewerWidget(widget, () => true),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, 3, undefined)
        });



        commands.registerCommand(WaveformViewerCommands.RENDER_MULTI_BIT, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth > 1 || attrs.variableType == 'Real'),
            isVisible:(widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth > 1 || attrs.variableType == 'Real'),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, undefined, "multiBit")
        });

        commands.registerCommand(WaveformViewerCommands.RENDER_LINEAR, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth > 1 || attrs.variableType == 'Real'),
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth > 1 || attrs.variableType == 'Real'),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) =>  widget.setValueFormat(id, undefined, undefined, "linear")
        });

        commands.registerCommand(WaveformViewerCommands.RENDER_STEPPED, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth > 1 || attrs.variableType == 'Real'),
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && (attrs.signalWidth > 1 || attrs.variableType == 'Real'),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, undefined, "stepped")
        });

        commands.registerCommand(WaveformViewerCommands.RENDER_LINEAR_SIGN, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, undefined, "linearSigned")
        });

        commands.registerCommand(WaveformViewerCommands.RENDER_STEPPED_SIGN, {
            isEnabled: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            isVisible: (widget: WaveformWidget, id: number, attrs: NetlistData) => this.withWaveformViewerWidget(widget, () => true) && attrs.signalWidth > 1,
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.setValueFormat(id, undefined, undefined, "steppedSigned")
        });


        commands.registerCommand(WaveformViewerCommands.COPY_SIGNAL, {
            isEnabled: widget => this.withWaveformViewerWidget(widget, () => true),
            isVisible: widget => this.withWaveformViewerWidget(widget, () => true),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => {
                let result = "";
                if (attrs.modulePath !== "") {result += attrs.modulePath + ".";}
                if (attrs.signalName) {result += attrs.signalName;}
                this.clipboard.writeText(result);
            }
        });

        commands.registerCommand(WaveformViewerCommands.COPY_VALUE, {
            isEnabled: widget => this.withWaveformViewerWidget(widget, () => true),
            isVisible: widget => this.withWaveformViewerWidget(widget, () => true),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => widget.copyValueAtMarker(id)
        });

        commands.registerCommand(WaveformViewerCommands.REMOVE, {
            isEnabled: widget => this.withWaveformViewerWidget(widget, () => true),
            isVisible: widget => this.withWaveformViewerWidget(widget, () => true),
            execute: (widget: WaveformWidget, id: number, attrs: NetlistData) => {
                if (id !== undefined) {
                    widget.removeSignalFromDocument(id);
                }
            }
        });

      }
      
    registerMenus(menus: MenuModelRegistry): void {

        menus.registerSubmenu(WaveformViewerContextMenu.FORMAT_SUBMENU, "Format Value", {order: '1'});
        menus.registerSubmenu(WaveformViewerContextMenu.COLOR_SUBMENU, "Change Color", {order: '2'});
        menus.registerSubmenu(WaveformViewerContextMenu.RENDER_SUBMENU, "Render Type", {order: '3'});

        menus.registerMenuAction(WaveformViewerContextMenu.FORMAT_SUBMENU, {
            commandId: WaveformViewerCommands.FORMAT_BINARY.id,
            order: '1'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.FORMAT_SUBMENU, {
            commandId: WaveformViewerCommands.FORMAT_HEX.id,
            order: '2'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.FORMAT_SUBMENU, {
            commandId: WaveformViewerCommands.FORMAT_OCTAL.id,
            order: '3'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.FORMAT_SUBMENU, {
            commandId: WaveformViewerCommands.FORMAT_DECIMAL_UNSIGN.id,
            order: '4'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.FORMAT_SUBMENU, {
            commandId: WaveformViewerCommands.FORMAT_DECIMAL_SIGN.id,
            order: '5'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.FORMAT_SUBMENU, {
            commandId: WaveformViewerCommands.FORMAT_FLOAT.id,
            order: '6'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.FORMAT_SUBMENU, {
            commandId: WaveformViewerCommands.FORMAT_ASCII.id,
            order: '7'
        });



        menus.registerMenuAction(WaveformViewerContextMenu.COLOR_SUBMENU, {
            commandId: WaveformViewerCommands.COLOR_1.id,
            order: '1'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.COLOR_SUBMENU, {
            commandId: WaveformViewerCommands.COLOR_2.id,
            order: '2'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.COLOR_SUBMENU, {
            commandId: WaveformViewerCommands.COLOR_3.id,
            order: '3'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.COLOR_SUBMENU, {
            commandId: WaveformViewerCommands.COLOR_4.id,
            order: '4'
        });



        menus.registerMenuAction(WaveformViewerContextMenu.RENDER_SUBMENU, {
            commandId: WaveformViewerCommands.RENDER_MULTI_BIT.id,
            order: '1'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.RENDER_SUBMENU, {
            commandId: WaveformViewerCommands.RENDER_LINEAR.id,
            order: '2'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.RENDER_SUBMENU, {
            commandId: WaveformViewerCommands.RENDER_STEPPED.id,
            order: '3'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.RENDER_SUBMENU, {
            commandId: WaveformViewerCommands.RENDER_LINEAR_SIGN.id,
            order: '4'
        });

        menus.registerMenuAction(WaveformViewerContextMenu.RENDER_SUBMENU, {
            commandId: WaveformViewerCommands.RENDER_STEPPED_SIGN.id,
            order: '5'
        });



        menus.registerMenuAction(WAVEFORM_VIEWER_CONTEXT_MENU, {
            commandId: WaveformViewerCommands.COPY_SIGNAL.id,
            order: '5'
        });

        menus.registerMenuAction(WAVEFORM_VIEWER_CONTEXT_MENU, {
            commandId: WaveformViewerCommands.COPY_VALUE.id,
            order: '6'
        });

        menus.registerMenuAction(WAVEFORM_VIEWER_CONTEXT_MENU, {
            commandId: WaveformViewerCommands.REMOVE.id,
            order: '7'
        });

    }
  
      protected withWaveformViewerWidget<T>(widget: Widget | undefined, cb: (navigator: WaveformWidget) => T): T | false {
          if (widget instanceof WaveformWidget) {
              return cb(widget);
          }
          return false;
      }
  

}