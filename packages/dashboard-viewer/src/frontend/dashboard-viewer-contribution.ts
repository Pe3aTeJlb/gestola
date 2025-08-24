import { inject, injectable } from '@theia/core/shared/inversify';
import { DashboardViewerWidget } from './dashboard-viewer-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { Command } from '@theia/core/lib/common/command';
import { DashboardViewerFileOpener } from './dashboard-viewer-file-opener';

export const DashboardViewerCommand: Command = { id: 'dashboard-viewer:command', label: 'Dashboard Viewer' };

@injectable()
export class DashboardViewerContribution extends AbstractViewContribution<DashboardViewerWidget> {

    @inject(DashboardViewerFileOpener)
    protected readonly nodeRedFileOpener: DashboardViewerFileOpener;

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
            widgetId: DashboardViewerWidget.ID,
            widgetName: DashboardViewerWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
            toggleCommandId: DashboardViewerCommand.id
        });
    }

}
