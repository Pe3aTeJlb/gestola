/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 *******************************************************************************/
import { Command, CommandHandler, CommandRegistry, MenuModelRegistry, URI } from '@theia/core';
import { AbstractViewContribution, WidgetOpenerOptions } from '@theia/core/lib/browser';
import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { TreeAnchor, TreeContextMenu } from '@eclipse-emfcloud/theia-tree-editor';
import { generateAddCommandDescriptions } from '@eclipse-emfcloud/theia-tree-editor';
import { TreeModelService } from './tree-model-service';
import { inject } from 'inversify';
import { TreeLabelProvider } from './tree-label-provider';
import { ProjectSettingsEditorWidget } from './project-settings-editor';
import { ProjectManager } from '@gestola/project-manager';

export const TreeEditorIntegrationCommand: Command = { id: 'tree-editor:command', label: 'Tree Editor' };

export class TreeEditorContribution extends AbstractViewContribution<ProjectSettingsEditorWidget> {

    private commandMap: Map<string, TreeEditor.AddCommandDescription>;

    @inject(TreeModelService) modelService: TreeEditor.ModelService;
    @inject(TreeLabelProvider) labelProvider: TreeLabelProvider;
    @inject(ProjectManager) projManager: ProjectManager;

    constructor(
       
    ){
        super({
            widgetId: ProjectSettingsEditorWidget.ID,
            widgetName: ProjectSettingsEditorWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
            toggleCommandId: TreeEditorIntegrationCommand.id
        });
    }
/*
    async open(args: Partial<OpenViewArguments> = {}, uri: URI): Promise<ProjectSettingsEditorWidget> {
        const shell = this.shell;
        const widget = await this.widgetManager.getOrCreateWidget(this.options.viewContainerId || this.viewId, uri);
        const tabBar = shell.getTabBarFor(widget);
        const area = shell.getAreaFor(widget);
        if (!tabBar) {
            // The widget is not attached yet, so add it to the shell
            const widgetArgs: OpenViewArguments = {
                ...this.defaultViewOptions,
                ...args
            };
            await shell.addWidget(widget, widgetArgs);
        } else if (args.toggle && area && shell.isExpanded(area) && tabBar.currentTitle === widget.title) {
            // The widget is attached and visible, so collapse the containing panel (toggle)
            switch (area) {
                case 'left':
                case 'right':
                    await shell.collapsePanel(area);
                    break;
                case 'bottom':
                    // Don't collapse the bottom panel if it's currently split
                    if (shell.bottomAreaTabBars.length === 1) {
                        await shell.collapsePanel('bottom');
                    }
                    break;
                default:
                    // The main area cannot be collapsed, so close the widget
                    await this.closeView();
            }
            return this.widget;
        }
        if (widget.isAttached && args.activate) {
            await shell.activateWidget(this.viewId);
        } else if (widget.isAttached && args.reveal) {
            await shell.revealWidget(this.viewId);
        }
        return this.widget;
    }
*/
    async open(uri: URI) {
        const widget: ProjectSettingsEditorWidget = await this.widgetManager.getOrCreateWidget(ProjectSettingsEditorWidget.ID, uri);
        await this.doOpen(widget, uri);
        return widget;
    }
    
    protected async doOpen(widget: ProjectSettingsEditorWidget, uri: URI): Promise<void> {
        const op: WidgetOpenerOptions = {
            mode: 'activate',
        };
        if (!widget.isAttached) {
            await this.shell.addWidget(widget, op.widgetOptions || { area: 'main' });
        }
        if (op.mode === 'activate') {
            await this.shell.activateWidget(widget.id);
        } else if (op.mode === 'reveal') {
            await this.shell.revealWidget(widget.id);
        }
    }

    private getCommandMap(): Map<string, TreeEditor.AddCommandDescription> {
        if (!this.commandMap) {
            this.commandMap = generateAddCommandDescriptions(this.modelService);
        }
        return this.commandMap;
    }

    override registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(TreeEditorIntegrationCommand, {
            execute: (uri: URI) => {
                uri
                ? this.open(uri)
                : this.open(this.projManager.getCurrProject()!.uri.withoutFragment())
            }
        });

        this.getCommandMap().forEach((description, _commandId, _map) => {
            commands.registerCommand(
                description.command,
                new AddCommandHandler(description.parentType, description.property, description.type, this.modelService)
            );
        });
    }

    override registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
        this.getCommandMap().forEach((description, _property, _map) => {
            const iconInfo: TreeEditor.CommandIconInfo = {
                _id: 'theia-tree-editor-command-icon-info',
                editorId: ProjectSettingsEditorWidget.ID,
                type: description.type
            };
            menus.registerMenuAction(TreeContextMenu.ADD_MENU, {
                commandId: description.command.id,
                label: description.command.label,
                icon: this.labelProvider.getIcon?.(iconInfo)
            });
        });
    }
}

class AddCommandHandler implements CommandHandler {
    constructor(
        private readonly parent: string,
        private readonly property: string,
        private readonly type: string,

        private modelService: TreeEditor.ModelService
    ) {}

    execute(treeAnchor: TreeAnchor): void {
        treeAnchor.onClick(this.property, this.type);
    }

    isVisible(treeAnchor: TreeAnchor): boolean {
        if (!treeAnchor) {
            return false;
        }
        const nodeType = treeAnchor.node.jsonforms.type;
        if (nodeType !== this.parent) {
            return false;
        }

        // Check whether the node object's type can contain children of this command's type.
        return this.modelService
            .getChildrenMapping()
            .get(nodeType)!
            .map(desc => desc.children)
            .reduce((acc, val) => acc.concat(val), [])
            .reduce((acc, val) => acc.add(val), new Set<string>())
            .has(this.type);
    }
}
