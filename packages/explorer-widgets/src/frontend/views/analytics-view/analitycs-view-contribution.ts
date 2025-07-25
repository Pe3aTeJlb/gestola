import { injectable, inject } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { Command } from "@theia/core";
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { ANALYTICS_VIEW_CONTAINER_ID, ANALYTICS_VIEW_MENU_LABEL } from './analytics-view-widget-factory';
import { DatabaseExplorerWidget } from '../../widgets/database-explorer/database-explorer-widget';

export const FPGA_VIEW_TOGGLE_COMMAND: Command = {
    id: "analytics-view:toggle",
    label: ANALYTICS_VIEW_MENU_LABEL
};

@injectable()
export class AnalyticsViewContribution extends AbstractViewContribution<DatabaseExplorerWidget> implements FrontendApplicationContribution {

    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
    ) {
        super({
            viewContainerId: ANALYTICS_VIEW_CONTAINER_ID,
            widgetId: DatabaseExplorerWidget.ID,
            widgetName: ANALYTICS_VIEW_MENU_LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: FPGA_VIEW_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

}