import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution,  WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { ProjectExplorerWidget } from './gestola-project-explorer/project-explorer/project-explorer-widget';
import { ProjectManager } from './project-manager/project-manager';
import { ProjectExplorerViewContribution } from './gestola-project-explorer/project-explorer/project-explorer-contribution';
import { GestolaProjectExplorerWidgetFactory } from './gestola-project-explorer/gestola-project-explorer-widget-factory';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { GestolaFileNavigatorWidget, GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions, createFileNavigatorContainer } from './gestola-project-explorer/file-explorer/file-navigator-widget';

export default new ContainerModule((bind, _unbind) => {

    //Project Manager
    bind(FrontendApplicationContribution).toService(ProjectManager);
    bind(ProjectManager).toSelf().inSingletonScope();;

    /*
    *   GESTOLA PROJECT EXPLORER
    */

    //Widget Factory
    bind(GestolaProjectExplorerWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(GestolaProjectExplorerWidgetFactory);

    //Project Explorer
    bindViewContribution(bind, ProjectExplorerViewContribution);
    bind(FrontendApplicationContribution).toService(ProjectExplorerViewContribution);
    bind(TabBarToolbarContribution).toService(ProjectExplorerViewContribution);
    bind(ProjectExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: ProjectExplorerWidget.ID,
        createWidget: () => ProjectExplorerWidget.createWidget(container)
    })).inSingletonScope();

  
    //File Navigator
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: GESTOLA_FILE_NAVIGATOR_ID,
        createWidget: (options: GestolaFileNavigatorOptions) => {

            console.log(options.id);
            const child = createFileNavigatorContainer(ctx.container);
            child.bind(GestolaFileNavigatorOptions).toConstantValue(options);
            child.bind('terminal-dom-id').toConstantValue(options.id);

            return child.get(GestolaFileNavigatorWidget);
        }
    }));

});