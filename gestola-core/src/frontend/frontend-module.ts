//import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { WidgetContribution } from './widget-contribution';
import { WidgetWidget } from './widget-widget';
import { GestolaProjectExplorerWidgetFactory } from './project-explorer/gestola-project-explorer-widget-factory';
import { GestolaProjectsExplorerWidget } from './project-explorer/projects-explorer-widget';
import { GestolaProjectsExplorerContribution } from './project-explorer/projects-explorer-contribution';
//import { ProjectExplorerCommandContribution, ProjectExplorerMenuContribution } from './project-manager/gestola-project-explorer-commands-contribution';
import { ProjectManager } from './project-manager/project-manager';

export default new ContainerModule((bind,_unbind, isBound, rebind) => {


    //Project Explorer Commands and Menus
    //bind(CommandContribution).to(ProjectExplorerCommandContribution);
    //bind(MenuContribution).to(ProjectExplorerMenuContribution);

    //Project Manager
    bind(ProjectManager).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(ProjectManager);

    //Trash
    bindViewContribution(bind, WidgetContribution);
    bind(FrontendApplicationContribution).toService(WidgetContribution);
    bind(WidgetWidget).toSelf();
    
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: WidgetWidget.ID,
        createWidget: () => ctx.container.get<WidgetWidget>(WidgetWidget)
    }));

    bindViewContribution(bind, GestolaProjectsExplorerContribution);
    bind(FrontendApplicationContribution).toService(GestolaProjectsExplorerContribution);
    bind(GestolaProjectsExplorerWidget).toSelf();
    
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: GestolaProjectsExplorerWidget.ID,
        createWidget: () => ctx.container.get<GestolaProjectsExplorerWidget>(GestolaProjectsExplorerWidget)
    }));

    bind(GestolaProjectExplorerWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(GestolaProjectExplorerWidgetFactory);

});
