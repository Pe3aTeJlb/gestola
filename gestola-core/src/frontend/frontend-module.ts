import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution,  WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { ProjectExplorerWidget } from './gestola-project-explorer/project-explorer/project-explorer-widget';
import { ProjectManager } from './project-manager/project-manager';
import { ProjectExplorerViewContribution } from './gestola-project-explorer/project-explorer/project-explorer-contribution';
import { CommandContribution, MenuContribution } from '@theia/core';
import { GestolaProjectExplorerWidgetFactory } from './gestola-project-explorer/project-explorer/gestola-project-explorer-widget-factory';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

export default new ContainerModule((bind, _unbind) => {

    //Project Manager
    bind(FrontendApplicationContribution).toService(ProjectManager);
    bind(ProjectManager).toSelf().inSingletonScope();;

    //Project Explorer
    bindViewContribution(bind, ProjectExplorerViewContribution);
    bind(FrontendApplicationContribution).toService(ProjectExplorerViewContribution);
    bind(TabBarToolbarContribution).toService(ProjectExplorerViewContribution);
    bind(CommandContribution).toService(ProjectExplorerViewContribution);
    bind(MenuContribution).toService(ProjectExplorerViewContribution)
    bind(ProjectExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: ProjectExplorerWidget.ID,
        createWidget: () => ProjectExplorerWidget.createWidget(container)
    })).inSingletonScope();

  
    //Trash/////////////////////////
    
    ////////////////////////////////////////

    //Gestola Project Explorer Widget Factory
    bind(GestolaProjectExplorerWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(GestolaProjectExplorerWidgetFactory);

});