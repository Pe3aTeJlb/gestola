import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ProjectExplorerWidget } from './project-explorer-widget';
import { GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID } from './gestola-project-explorer-widget-factory';

export const PROJECT_EXPLORER_TOGGLE_COMMAND_ID = 'project-explorer:toggle';

@injectable()
export class ProjectExplorerViewContribution extends AbstractViewContribution<ProjectExplorerWidget> {

    constructor() {
        super({

            viewContainerId: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: ProjectExplorerWidget.LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: PROJECT_EXPLORER_TOGGLE_COMMAND_ID,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }
  

}