import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution,  WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { WidgetWidget } from './widget-widget';
import { ProjectExplorerWidget } from './gestola-project-explorer/project-explorer/project-explorer-widget';
import { ProjectManager } from './project-manager/project-manager';
import { ProjectExplorerViewContribution } from './gestola-project-explorer/project-explorer/project-explorer-contribution';
import { CommandContribution, MenuContribution } from '@theia/core';
import { WidgetContribution } from './widget-contribution';
import { GestolaProjectExplorerWidgetFactory } from './gestola-project-explorer/project-explorer/gestola-project-explorer-widget-factory';

export default new ContainerModule((bind, _unbind) => {

    //Project Manager
    bind(CommandContribution).to(ProjectManager);
    bind(MenuContribution).to(ProjectManager);
    bind(FrontendApplicationContribution).toService(ProjectManager);
    bind(ProjectManager).toSelf().inSingletonScope();

    //Works until this
    //////////////////////////

    bindViewContribution(bind, WidgetContribution);
    bind(FrontendApplicationContribution).toService(WidgetContribution);
    bind(WidgetWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: WidgetWidget.ID,
        createWidget: () => ctx.container.get<WidgetWidget>(WidgetWidget)
    }));


    //Project Explorer
    bindViewContribution(bind, ProjectExplorerViewContribution);
    bind(FrontendApplicationContribution).toService(ProjectExplorerViewContribution);
    bind(ProjectExplorerWidget).toSelf();
    /*bind(WidgetFactory).toDynamicValue(ctx => ({
      id: ProjectExplorerWidget.ID,
      createWidget: () => {
        const child = createTreeContainer(ctx.container);

        child.unbind(TreeImpl);
        child.bind(ProjectExplorerTreeImpl).toSelf();
        child.rebind(Tree).toService(ProjectExplorerTreeImpl);

        child.unbind(TreeWidget);
        child.bind(ProjectExplorerWidget).toSelf();


        return child.get(ProjectExplorerWidget);

      }
  }));*/

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