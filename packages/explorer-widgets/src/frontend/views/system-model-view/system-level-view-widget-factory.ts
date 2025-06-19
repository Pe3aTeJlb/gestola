import { inject, injectable } from '@theia/core/shared/inversify';
import { codicon, ViewContainer, ViewContainerTitleOptions, WidgetFactory, WidgetManager } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions } from '../../widgets/file-explorer/file-navigator-widget';

export const SYSTEM_LEVEL_VIEW_CONTAINER_ID = 'gestole-system-level-view-container';
export const SYSTEM_LEVEL_VIEW_MENU_LABEL = nls.localize("gestola/system-level/view-container-title", "Gestola: System Level")
export const SYSTEM_LEVEL_VIEW_LABEL = nls.localize("gestola/system-level/project-explorer-view-title", "Gestola: System Level");
export const SYSTEM_LEVEL_VIEW_CONTAINER_TITLE_OPTIONS: ViewContainerTitleOptions = {
    label: nls.localize("gestola/system-level/view-container-title", "System Level"),
    iconClass: codicon('files'),
    closeable: true
};

@injectable()
export class SystemLevelWidgetFactory implements WidgetFactory {

    @inject(ProjectManager) protected readonly projectManager: ProjectManager;

    static ID = SYSTEM_LEVEL_VIEW_CONTAINER_ID;

    readonly id = SystemLevelWidgetFactory.ID;

    protected widgetOptions: ViewContainer.Factory.WidgetOptions = {
        order: 1,
        canHide: true,
        initiallyCollapsed: false,
        weight: 80,
        disableDraggingToOtherContainers: false
    };

    @inject(ViewContainer.Factory)
    protected readonly viewContainerFactory: ViewContainer.Factory;
    
    @inject(WidgetManager) 
    protected readonly widgetManager: WidgetManager;

    async createWidget(): Promise<ViewContainer> {

        const viewContainer = this.viewContainerFactory({
            id: SYSTEM_LEVEL_VIEW_CONTAINER_ID,
            progressLocationId: 'gestola-system-level-widget-factory'
        });
        viewContainer.setTitleOptions(SYSTEM_LEVEL_VIEW_CONTAINER_TITLE_OPTIONS);
    
        const systemFollderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-system", viewContainerID: SYSTEM_LEVEL_VIEW_CONTAINER_ID});
        const miscFolderFileNavigator = await this.widgetManager.getOrCreateWidget(GESTOLA_FILE_NAVIGATOR_ID, 
            <GestolaFileNavigatorOptions>{navigatorID: "file-navigator-misc", viewContainerID: SYSTEM_LEVEL_VIEW_CONTAINER_ID});

        viewContainer.addWidget(systemFollderFileNavigator, this.widgetOptions);
        viewContainer.addWidget(miscFolderFileNavigator, this.widgetOptions);

        viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));

        this.projectManager.onDidChangeProjectList(() => {
            viewContainer.getParts().slice(1).forEach(i => i.setHidden(this.projectManager.getProjectsCount() == 0));
        });

        return viewContainer;
    }

}