import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ProjectExplorerWidget } from '../../widgets/project-explorer/project-explorer-widget';
import { GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID } from './gestola-project-explorer-widget-factory';
import { Command } from "@theia/core";
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { GestolaExplorerContextKeyService } from './gestola-explorer-context-key-service';
import { GestolaFileNavigatorWidget } from '../../widgets/file-explorer/file-navigator-widget';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';

export const PROJECT_EXPLORER_TOGGLE_COMMAND: Command = {
    id: "project-explorer:toggle",
    label: ProjectExplorerWidget.MENU_LABEL
};

@injectable()
export class GestolaProjectExplorerViewContribution extends AbstractViewContribution<ProjectExplorerWidget> implements FrontendApplicationContribution {

    @inject(GestolaExplorerContextKeyService)
    protected readonly contextKeyService: GestolaExplorerContextKeyService;

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;


    constructor(
        @inject(FileNavigatorPreferences) protected readonly fileNavigatorPreferences: FileNavigatorPreferences,
    ) {
        super({
            viewContainerId: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
            widgetId: ProjectExplorerWidget.ID,
            widgetName: ProjectExplorerWidget.MENU_LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: PROJECT_EXPLORER_TOGGLE_COMMAND.id,
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {

        await this.fileNavigatorPreferences.ready;

        const updateFocusContextKeys = () => {
            const hasFocus = this.shell.activeWidget instanceof GestolaFileNavigatorWidget;
            this.contextKeyService.explorerViewletFocus.set(hasFocus);
            this.contextKeyService.filesNavigatorFocus.set(hasFocus);
            if(hasFocus){
                (<GestolaFileNavigatorWidget>this.shell.activeWidget).model.applySelection();
            }
        };
        updateFocusContextKeys();
        this.shell.onDidChangeActiveWidget(updateFocusContextKeys);

    }

}