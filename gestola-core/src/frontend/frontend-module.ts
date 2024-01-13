/**
 * Generated using theia-extension-generator
 */
//import { GestolaCoreCommandContribution, GestolaCoreMenuContribution } from './gestola-core-contribution';
//import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution, WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
//import { FileNavigatorContribution } from './file-navigator-contribution';
import { WidgetContribution } from './widget-contribution';
import { WidgetWidget } from './widget-widget';
import { GestolaProjectExplorerWidgetFactory } from './project-explorer/gestola-project-explorer-widget-factory';
import { GestolaProjectsExplorerWidget } from './project-explorer/projects-explorer-widget';
import { GestolaProjectsExplorerContribution } from './project-explorer/projects-explorer-contribution';

export default new ContainerModule((bind,_unbind, isBound, rebind) => {

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
