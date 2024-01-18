import { AbstractViewContribution } from "@theia/core/lib/browser";
import { injectable } from "inversify";
import { FamilyTreeWidget } from "./family-tree-widget";
import { Command, CommandRegistry, MenuModelRegistry } from "@theia/core";
//import { GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID } from "../gestola-project-explorer/project-explorer/gestola-project-explorer-widget-factory";

export const FamilyTreeWidgetCommand: Command = {
  id: "family-tree-widget:command"
};

@injectable()
export class FamilyTreeWidgetContribution extends AbstractViewContribution<
  FamilyTreeWidget
> {
  constructor() {
    super({
      //viewContainerId: GESTOLA_PROJECT_EXPLORER_VIEW_CONTAINER_ID,
      widgetId: FamilyTreeWidget.ID,
      widgetName: FamilyTreeWidget.LABEL,
      defaultWidgetOptions: { area: "left" },
      toggleCommandId: FamilyTreeWidgetCommand.id
    });
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(FamilyTreeWidgetCommand, {
      execute: () => super.openView({ activate: false, reveal: true })
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
  }
}
