import "../../styles/index.css"
import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution,   KeybindingContribution,   LabelProviderContribution,   WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { GestolaProjectExplorerWidgetFactory } from './views/project-explorer-view/gestola-project-explorer-widget-factory';
import { GestolaFileNavigatorWidget, GESTOLA_FILE_NAVIGATOR_ID, GestolaFileNavigatorOptions, createFileNavigatorContainer } from './widgets/file-explorer/file-navigator-widget';
import { GestolaExplorerContextKeyService } from './views/project-explorer-view/gestola-explorer-context-key-service';
import { GestolaProjectExplorerViewContribution } from './views/project-explorer-view/gestola-project-explorer-contribution';
import { RTLModelFilesExcludeHandler } from "./handlers/rtl-model-exclude-handler";
import { RTLModelFilesIncludeHandler } from "./handlers/rtl-model-include-handler";
import { RTLModelSetTopModuleHandler } from "./handlers/rtl-model-set-top-handler";
import { ModuleHierarchyTreeWidget } from "./widgets/module-hierarchy/module-hierarchy-widget";
import { TestBenchExplorerWidget } from "./widgets/testbenches-explorer/testbenches-explorer-widget";
import { TestbenchesAddHandler } from "./handlers/testbenches-add-handler";
import { TestbenchesRemoveHandler } from "./handlers/testbenches-remove-handler";
import { ProjectExplorerWidget } from "./widgets/project-explorer/project-explorer-widget";
import { CommandContribution, MenuContribution } from "@theia/core";
import { TabBarToolbarContribution } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { FileNavigatorCommandsContribution } from "./widgets/file-explorer/file-navigator-commands-contribution";
import { ProjectExplorerCommandsContribution } from "./widgets/project-explorer/project-explorer-commands-contribution";
import { ModuleHierarchyCommandsContribution } from "./widgets/module-hierarchy/module-hierarchy-commands-contribution";
import { TestBenchExplorerCommandsContribution } from "./widgets/testbenches-explorer/testbenches-explorer-commands-contribution";
import { RTLLevelWidgetFactory } from "./views/rtl-model-view/rtl-level-view-widget-factory";
import { RTLLevelViewContribution } from "./views/rtl-model-view/rtl-level-view-contribution";
import { SystemLevelViewContribution } from "./views/system-model-view/system-level-view-contribution";
import { SystemLevelWidgetFactory } from "./views/system-model-view/system-level-view-widget-factory";
import { TopologyLevelVLSIWidgetFactory } from "./views/vlsi-view/vlsi-view-widget-factory";
import { TopologyLevelVLSIViewContribution } from "./views/vlsi-view/vlsi-view-contribution";
import { TopologyLevelFPGAWidgetFactory } from "./views/fpga-view/fpga-view-widget-factory";
import { TopologyLevelFPGAViewContribution } from "./views/fpga-view/fpga-view-contribution";
import { LLDExplorerCommandsContribution } from "./widgets/low-level-design-explorer/lld-commands-contribution";
import { LLDExplorerWidget } from "./widgets/low-level-design-explorer/lld-explorer-widget";
import { ConstrainsExplorerCommandsContribution } from "./widgets/constrains-explorer/constrains-explorer-commands-contribution";
import { ConstrainsExplorerWidget, createConstrainsExplorerContainer } from "./widgets/constrains-explorer/constrains-explorer-widget";
import { ConstrainsExplorerLabelProvider } from "./widgets/constrains-explorer/constrains-explorer-label-provider";
import { DatabaseExplorerWidget } from "./widgets/database-explorer/database-explorer-widget";
import { AnalyticsWidgetFactory } from "./views/analytics-view/analytics-view-widget-factory";
import { AnalyticsViewContribution } from "./views/analytics-view/analitycs-view-contribution";
import { DatabaseExplorerCommandsContribution } from "./widgets/database-explorer/database-explorer-commands-contribution";

export default new ContainerModule((bind, _unbind) => {

    /*
    *   WIDGETS
    */

    // File Navigator

    bind(FileNavigatorCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(FileNavigatorCommandsContribution);
    bind(TabBarToolbarContribution).toService(FileNavigatorCommandsContribution);
    bind(MenuContribution).toService(FileNavigatorCommandsContribution);
    bind(KeybindingContribution).toService(FileNavigatorCommandsContribution);

    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: GESTOLA_FILE_NAVIGATOR_ID,
        createWidget: (options: GestolaFileNavigatorOptions) => {
            const child = createFileNavigatorContainer(ctx.container, options);
            child.bind(GestolaFileNavigatorOptions).toConstantValue(options);
            return child.get(GestolaFileNavigatorWidget);
        }
    }));

    // Project Explorer

    bind(ProjectExplorerCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(ProjectExplorerCommandsContribution);
    bind(TabBarToolbarContribution).toService(ProjectExplorerCommandsContribution);
    bind(MenuContribution).toService(ProjectExplorerCommandsContribution);

    bind(ProjectExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: ProjectExplorerWidget.ID,
        createWidget: () => ProjectExplorerWidget.createWidget(container)
    })).inSingletonScope();

    // RTL Model Explorer

    bind(LLDExplorerCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(LLDExplorerCommandsContribution);
    bind(TabBarToolbarContribution).toService(LLDExplorerCommandsContribution);

    bind(LLDExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: LLDExplorerWidget.ID,
        createWidget: () => LLDExplorerWidget.createWidget(container)
    })).inSingletonScope();

    // Modules Hierarchy 

    bind(ModuleHierarchyCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(ModuleHierarchyCommandsContribution);
    bind(TabBarToolbarContribution).toService(ModuleHierarchyCommandsContribution);

    bind(ModuleHierarchyTreeWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: ModuleHierarchyTreeWidget.ID,
        createWidget: () => ModuleHierarchyTreeWidget.createWidget(container)
    })).inSingletonScope();

    // TestBenches Explorer

    bind(TestBenchExplorerCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(TestBenchExplorerCommandsContribution);
    bind(TabBarToolbarContribution).toService(TestBenchExplorerCommandsContribution);
    bind(MenuContribution).toService(TestBenchExplorerCommandsContribution);

    bind(TestBenchExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: TestBenchExplorerWidget.ID,
        createWidget: () => TestBenchExplorerWidget.createWidget(container)
    })).inSingletonScope();

    // Constrains Explorer

    bind(ConstrainsExplorerCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(ConstrainsExplorerCommandsContribution);
    bind(TabBarToolbarContribution).toService(ConstrainsExplorerCommandsContribution);
    bind(MenuContribution).toService(ConstrainsExplorerCommandsContribution);

    bind(ConstrainsExplorerLabelProvider).toSelf().inSingletonScope();
    bind(LabelProviderContribution).toService(ConstrainsExplorerLabelProvider);

    bind(ConstrainsExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: ConstrainsExplorerWidget.ID,
        createWidget: () => {
            const child = createConstrainsExplorerContainer(ctx.container);
            return child.get(ConstrainsExplorerWidget);
        }
    }));

    //Analytics Database Explorer

    bind(DatabaseExplorerCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(DatabaseExplorerCommandsContribution);
    bind(TabBarToolbarContribution).toService(DatabaseExplorerCommandsContribution);

    bind(DatabaseExplorerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: DatabaseExplorerWidget.ID,
        createWidget: () => DatabaseExplorerWidget.createWidget(container)
    })).inSingletonScope();

    /*
    *   VIEWS
    */ 

    // Gestola Project Explorer

    bind(GestolaProjectExplorerWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(GestolaProjectExplorerWidgetFactory);

    bind(GestolaExplorerContextKeyService).toSelf().inSingletonScope();
    bindViewContribution(bind, GestolaProjectExplorerViewContribution);
    bind(FrontendApplicationContribution).toService(GestolaProjectExplorerViewContribution);

    // System Level View
  
    bind(SystemLevelWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(SystemLevelWidgetFactory);

    bindViewContribution(bind, SystemLevelViewContribution);
    bind(FrontendApplicationContribution).toService(SystemLevelViewContribution);

    // RTL Level View
  
    bind(RTLLevelWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(RTLLevelWidgetFactory);

    bindViewContribution(bind, RTLLevelViewContribution);
    bind(FrontendApplicationContribution).toService(RTLLevelViewContribution);


    // Topology Level FPGA View
  
    bind(TopologyLevelFPGAWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(TopologyLevelFPGAWidgetFactory);

    bindViewContribution(bind, TopologyLevelFPGAViewContribution);
    bind(FrontendApplicationContribution).toService(TopologyLevelFPGAViewContribution);


    // Topology Level VLSI View
  
    bind(TopologyLevelVLSIWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(TopologyLevelVLSIWidgetFactory);

    bindViewContribution(bind, TopologyLevelVLSIViewContribution);
    bind(FrontendApplicationContribution).toService(TopologyLevelVLSIViewContribution);


    // Analytics View

    bind(AnalyticsWidgetFactory).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(AnalyticsWidgetFactory);

    bindViewContribution(bind, AnalyticsViewContribution);
    bind(FrontendApplicationContribution).toService(AnalyticsViewContribution);

    /*
    *   HANDLERS
    */

    bind(RTLModelFilesIncludeHandler).toSelf().inSingletonScope();
    bind(RTLModelFilesExcludeHandler).toSelf().inSingletonScope();
    bind(RTLModelSetTopModuleHandler).toSelf().inSingletonScope();

    bind(TestbenchesAddHandler).toSelf().inSingletonScope();
    bind(TestbenchesRemoveHandler).toSelf().inSingletonScope();

});