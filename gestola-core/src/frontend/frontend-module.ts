import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, TreeImpl, TreeModel, TreeWidget, WidgetFactory, bindViewContribution, createTreeContainer } from '@theia/core/lib/browser';
import { WidgetWidget } from './widget-widget';
import { GestolaProjectExplorerWidgetFactory } from './gestola-project-explorer/project-explorer/gestola-project-explorer-widget-factory';
import { ProjectExplorerWidget } from './gestola-project-explorer/project-explorer/project-explorer-widget';
import { ProjectManager } from './project-manager/project-manager';
//import { ProjectExplorerViewContribution } from './gestola-project-explorer/project-explorer/project-explorer-contribution';
import { ProjectExplorerImpl } from './gestola-project-explorer/project-explorer/project-explorer-tree';
import { CommandContribution, MenuContribution } from '@theia/core';
import { WidgetContribution } from './widget-contribution';
import { FamilyTreeWidget } from './tree/family-tree-widget';
import { FamilyTree } from './tree/family-tree';
import { FamilyTreeWidgetContribution } from './tree/family-tree-contribution';

export default new ContainerModule((bind, _unbind, rebind) => {

    //Project Manager
    bind(CommandContribution).to(ProjectManager);
    bind(MenuContribution).to(ProjectManager);
    bind(ProjectManager).toSelf().inSingletonScope();

    //Works until this
    //////////////////////////

    bindViewContribution(bind, WidgetContribution);
    bind(FrontendApplicationContribution).toService(WidgetContribution);
    bind(WidgetWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: WidgetWidget.ID,
        createWidget: () => ctx.container.get<WidgetWidget>(WidgetWidget)
    })).inSingletonScope();


    //Project Explorer
    //bindViewContribution(bind, ProjectExplorerViewContribution);
    //bind(FrontendApplicationContribution).toService(ProjectExplorerViewContribution);
    /*
    bind(ProjectExplorerWidget).toSelf();
    bind(ProjectExplorerWidget).toDynamicValue(ctx =>
      createProjectExplorerWidget(ctx.container)
    );
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
      id: ProjectExplorerWidget.ID,
      createWidget: () => container.get(ProjectExplorerWidget)
    })).inSingletonScope();
*/
    //Trash/////////////////////////
    


    bindViewContribution(bind, FamilyTreeWidgetContribution);
    //bind(FrontendApplicationContribution).toService(FamilyTreeWidgetContribution);
    bind(FamilyTreeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: FamilyTreeWidget.ID,
        createWidget: () => createFamilyTreeWidget(ctx.container)
    })).inSingletonScope();
    
    ////////////////////////////////////////

    //Gestola Project Explorer Widget Factory
    bind(GestolaProjectExplorerWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(GestolaProjectExplorerWidgetFactory);

});

export function createProjectExplorerWidget(parent: interfaces.Container): ProjectExplorerWidget {
    return createProjectExplorerWidgetContainer(parent);
}
/*
export function createProjectExplorerWidgetContainer(parent: interfaces.Container): interfaces.Container {
    const child = createTreeContainer(parent, {
        props: { expandOnlyOnExpansionToggleClick: false, search: false },
        tree: ProjectExplorerImpl,
        widget: ProjectExplorerWidget,
        //model: ProjectExplorerImpl
       // decoratorService: OutlineDecoratorService,
    });
    return child;
}*/

export function createProjectExplorerWidgetContainer(
    parent: interfaces.Container
  ): ProjectExplorerWidget {
    const child = createTreeContainer(parent);
  
    child.unbind(TreeImpl);
    child.bind(ProjectExplorerImpl).toSelf();
    child.rebind(TreeModel).toService(ProjectExplorerImpl);
  
    child.unbind(TreeWidget);
    child.bind(ProjectExplorerWidget).toSelf();
  
    return child.get(ProjectExplorerWidget);
  }

  export function createFamilyTreeWidget(parent: interfaces.Container): FamilyTreeWidget {
    const child = createTreeContainer(parent);
  
    child.unbind(TreeImpl);
    child.bind(FamilyTree).toSelf();
    child.rebind(TreeModel).toService(FamilyTree);
  
    child.unbind(TreeWidget);
    child.bind(FamilyTreeWidget).toSelf();
  
    return child.get(FamilyTreeWidget);
  }