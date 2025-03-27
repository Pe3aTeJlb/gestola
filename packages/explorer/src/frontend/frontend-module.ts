import "../../styles/index.css"
import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution,  WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { ProjectExplorerWidget } from './gestola-project-explorer/project-explorer/project-explorer-widget';
import { GestolaProjectExplorerWidgetFactory } from './gestola-project-explorer/gestola-project-explorer-widget-factory';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { GestolaFileNavigatorWidget, GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions, createFileNavigatorContainer } from './gestola-project-explorer/file-explorer/file-navigator-widget';
import { GestolaExplorerContextKeyService } from './gestola-project-explorer/gestola-explorer-context-key-service';
import { GestolaProjectExplorerViewContribution } from './gestola-project-explorer/gestola-project-explorer-contribution';
import { SolutionExplorerWidget } from "./gestola-project-explorer/solution-explorer/solution-explorer-widget";
import { DesignFilesExcludeHandler } from "./gestola-project-explorer/design-exclude-handler";
import { DesignFilesIncludeHandler } from "./gestola-project-explorer/design-include-handler";
import { DesignSetTopModuleHandler } from "./gestola-project-explorer/design-set-top-handler";
import { ModuleHierarchyTreeWidget } from "./gestola-project-explorer/module-hierarchy/module-hierarchy-widget";

export default new ContainerModule((bind, _unbind) => {

    /*
    *   GESTOLA PROJECT EXPLORER
    */

    //Widget Factory
    bind(GestolaProjectExplorerWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(GestolaProjectExplorerWidgetFactory);

    //Project Explorer
    bind(GestolaExplorerContextKeyService).toSelf().inSingletonScope();
    bindViewContribution(bind, GestolaProjectExplorerViewContribution);
    bind(FrontendApplicationContribution).toService(GestolaProjectExplorerViewContribution);
    bind(TabBarToolbarContribution).toService(GestolaProjectExplorerViewContribution);

    bind(DesignFilesIncludeHandler).toSelf().inSingletonScope();
    bind(DesignFilesExcludeHandler).toSelf().inSingletonScope();
    bind(DesignSetTopModuleHandler).toSelf().inSingletonScope();

    bind(ProjectExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: ProjectExplorerWidget.ID,
        createWidget: () => ProjectExplorerWidget.createWidget(container)
    })).inSingletonScope();

    bind(SolutionExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: SolutionExplorerWidget.ID,
        createWidget: () => SolutionExplorerWidget.createWidget(container)
    })).inSingletonScope();

    bind(ModuleHierarchyTreeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: ModuleHierarchyTreeWidget.ID,
        createWidget: () => ModuleHierarchyTreeWidget.createWidget(container)
    })).inSingletonScope();

  
    //File Navigator
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: GESTOLA_FILE_NAVIGATOR_ID,
        createWidget: (options: GestolaFileNavigatorOptions) => {
            const child = createFileNavigatorContainer(ctx.container, options);
            child.bind(GestolaFileNavigatorOptions).toConstantValue(options);
            return child.get(GestolaFileNavigatorWidget);
        }
    }));

});