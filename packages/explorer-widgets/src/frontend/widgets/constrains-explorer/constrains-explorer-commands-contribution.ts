import { inject, injectable } from '@theia/core/shared/inversify';
import { CommonCommands, CompositeTreeNode, ExpandableTreeNode, LabelProvider, Widget } from '@theia/core/lib/browser';
import { CommandRegistry, CommandContribution } from '@theia/core/lib/common/command';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { MenuContribution, MenuModelRegistry, MenuPath, SelectionService, URI, nls } from '@theia/core';
import { UriAwareCommandHandler, UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { TestbenchesAddHandler } from '../../handlers/testbenches-add-handler';
import { TestbenchesRemoveHandler } from '../../handlers/testbenches-remove-handler';
import { ConstrainsExplorerWidget } from './constrains-explorer-widget';
import { VerilatorFrontendService } from '@gestola/verilator-wrapper/lib/frontend/verilator-service';
import { ConstrainsExplorerCommands } from './constrains-explorer-commands';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { FileNavigatorCommands } from '@theia/navigator/lib/browser/file-navigator-commands';
import { NavigatorDiffCommands } from '@theia/navigator/lib/browser/navigator-diff';
import { FileDownloadCommands } from '@theia/filesystem/lib/browser/download/file-download-command-contribution';
import { FileSystemCommands } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { FileSystemUtils } from '@theia/filesystem/lib/common';
import { WorkspaceInputDialog } from '@theia/workspace/lib/browser/workspace-input-dialog';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
const validFilename: (arg: string) => boolean = require('valid-filename');
import { FileStat } from '@theia/filesystem/lib/common/files';
import { USED_IN_IMPL_ONLY, USED_IN_NONE, USED_IN_SYNTH_AND_IMPL, USED_IN_SYTH_ONLY } from '@gestola/project-manager/lib/frontend/project-manager/fpga-topology-model';
import { VivadoFrontendService } from "@gestola/vivado-wrapper/lib/frontend/vivado-service";

export const CONSTRAINS_EXPLORER_CONTEXT_MENU: MenuPath = ['constrains-explorer-context-menu'];
export namespace ConstrainsContextMenu {
    export const NAVIGATION = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, 'navigation'];
    export const WORKSPACE = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '2_workspace'];
    export const COMPARE = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '3_compare'];
    export const SEARCH = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '4_search'];
    export const CLIPBOARD = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '5_cutcopypaste'];
    export const MODIFICATION = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '7_modification'];
    export const STAGE = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '8_stage'];
    export const RUN = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '9_run'];
}

@injectable()
export class ConstrainsExplorerCommandsContribution implements CommandContribution, TabBarToolbarContribution, MenuContribution {

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    @inject(FileService) protected readonly fileService: FileService;

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(VerilatorFrontendService)
    protected readonly verilatorService: VerilatorFrontendService;

    @inject(SelectionService) 
    protected readonly selectionService: SelectionService;

    @inject(TestbenchesAddHandler) 
    protected readonly testbenchesAddHandler: TestbenchesAddHandler;

    @inject(TestbenchesRemoveHandler) 
    protected readonly testbenchesRemoveHandler: TestbenchesRemoveHandler;

    @inject(VivadoFrontendService) 
    protected readonly vivadoService: VivadoFrontendService;

    protected newUriAwareCommandHandler(handler: UriCommandHandler<URI>): UriAwareCommandHandler<URI> {
        return UriAwareCommandHandler.MonoSelect(this.selectionService, handler);
    }

    protected newMultiUriAwareCommandHandler(handler: UriCommandHandler<URI[]>): UriAwareCommandHandler<URI[]> {
        return UriAwareCommandHandler.MultiSelect(this.selectionService, handler);
    }

    registerCommands(commands: CommandRegistry): void {

        commands.registerCommand(ConstrainsExplorerCommands.COLLAPSE_ALL, {
            execute: widget => this.withConstrainsExplorerWidget(widget, (widget) => ((widget.model.root) as CompositeTreeNode).children.forEach((i:ExpandableTreeNode) => i.expanded = false)),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });

        commands.registerCommand(ConstrainsExplorerCommands.REFRESH_EXPLORER, {
            execute: widget => this.withConstrainsExplorerWidget(widget, (widget) => widget.model.refresh()),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });



        commands.registerCommand(ConstrainsExplorerCommands.NEW_CONSTAINS_FILE, {
            execute: (...args) => this.withConstrainsExplorerWidget(args[0], () => {
                if((<ConstrainsExplorerWidget> args[0]).model.getFocusedNode()){
                    commands.executeCommand(WorkspaceCommands.NEW_FILE.id, ...args);
                }
            }),
            isEnabled: (widget) => this.withConstrainsExplorerWidget(widget, (widget: ConstrainsExplorerWidget) => !!this.projManager.getCurrProject() && !!widget.model.getFocusedNode()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });
/*
        commands.registerCommand(ConstrainsExplorerCommands.NEW_CONSTRAINS_SET, {
            execute: (widget) => this.withConstrainsExplorerWidget(widget, (widget) => commands.executeCommand(WorkspaceCommands.NEW_FOLDER.id, this.projManager.getCurrLLD()!.contrainsURI)),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: (widget => this.withConstrainsExplorerWidget(widget, () => true))
        });
*/
        commands.registerCommand(ConstrainsExplorerCommands.NEW_CONSTRAINS_SET, {
            execute: (widget) => this.withConstrainsExplorerWidget(widget, async (widget) => {
                const parent = await this.projManager.getCurrLLD()!.fpgaFolderFStat();
                const parentUri = parent.resource;
                const targetUri = parentUri.resolve('Untitled');
                const vacantChildUri = FileSystemUtils.generateUniqueResourceURI(parent, targetUri, true);
                const dialog = new WorkspaceInputDialog({
                    title: nls.localizeByDefault('New Folder...'),
                    maxWidth: 400,
                    parentUri: parentUri,
                    initialValue: vacantChildUri.path.base,
                    placeholder: nls.localize('theia/workspace/newFolderPlaceholder', 'Folder Name'),
                    validate: name => this.validateFileName(name, parent, true)
                }, this.labelProvider);
                dialog.open().then(async name => {
                    if (name) {
                        const folderUri = parentUri.resolve(name);
                        await this.fileService.createFolder(folderUri);
                        this.projManager.addFPGATopologyModel(folderUri);
                    }
                });
            }),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: (widget => this.withConstrainsExplorerWidget(widget, () => true))
        });

        commands.registerCommand(ConstrainsExplorerCommands.REMOVE_CONSTRAINS_SET, {
            execute: (widget, node) => this.withConstrainsExplorerWidget(widget, (widget) => {
                if('fpgaModel' in node){
                    this.projManager.removeFPGATopologyModel(node.fpgaModel);
                }
            }),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });

        commands.registerCommand(ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_NONE, {
            execute: (widget, node) => this.withConstrainsExplorerWidget(widget, (widget) => {
                node.parent.fpgaModel.setConstainsFileUsageType(node.uri, USED_IN_NONE);
            }),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });

        commands.registerCommand(ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_SYNTH, {
            execute: (widget, node) => this.withConstrainsExplorerWidget(widget, (widget) => {
                node.parent.fpgaModel.setConstainsFileUsageType(node.uri, USED_IN_SYTH_ONLY);
            }),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });

        commands.registerCommand(ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_IMPL, {
            execute: (widget, node) => this.withConstrainsExplorerWidget(widget, (widget) => {
                node.parent.fpgaModel.setConstainsFileUsageType(node.uri, USED_IN_IMPL_ONLY);
            }),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });

        commands.registerCommand(ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_SYNTH_IMPL, {
            execute: (widget, node) => this.withConstrainsExplorerWidget(widget, (widget) => {
                node.parent.fpgaModel.setConstainsFileUsageType(node.uri, USED_IN_SYNTH_AND_IMPL);
            }),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: widget => this.withConstrainsExplorerWidget(widget, () => true)
        });

        commands.registerCommand(ConstrainsExplorerCommands.FPGA_RUN_SYNTH_AND_IMPL_SELECTED, {
            execute: (widget, node) => this.withConstrainsExplorerWidget(widget, (widget) => {
                this.vivadoService.runVivado([node.fpgaModel]);
            }),
            isEnabled: widget => this.withConstrainsExplorerWidget(widget, () => !!this.projManager.getCurrProject()),
            isVisible: (widget, node) => this.withConstrainsExplorerWidget(widget, () => true) && !!node.fpgaModel
        });

    }
      
    registerToolbarItems(registry: TabBarToolbarRegistry): void {

        registry.registerItem({
            id: ConstrainsExplorerCommands.NEW_CONSTRAINS_SET.id,
            command: ConstrainsExplorerCommands.NEW_CONSTRAINS_SET.id,
            tooltip: nls.localizeByDefault('New Constrains Set'),
            priority: 1,
        });

        registry.registerItem({
            id: ConstrainsExplorerCommands.NEW_CONSTAINS_FILE.id,
            command: ConstrainsExplorerCommands.NEW_CONSTAINS_FILE.id,
            tooltip: nls.localizeByDefault('New Constrains File'),
            priority: 2,
        });

        registry.registerItem({
            id: ConstrainsExplorerCommands.REFRESH_EXPLORER.id,
            command: ConstrainsExplorerCommands.REFRESH_EXPLORER.id,
            tooltip: nls.localizeByDefault('Refresh'),
            priority: 3,
        });

        registry.registerItem({
            id: ConstrainsExplorerCommands.COLLAPSE_ALL.id,
            command: ConstrainsExplorerCommands.COLLAPSE_ALL.id,
            tooltip: nls.localizeByDefault('Collapse All'),
            priority: 4,
        });

    }

    registerMenus(registry: MenuModelRegistry): void {

        registry.registerMenuAction(ConstrainsContextMenu.NAVIGATION, {
            commandId: FileNavigatorCommands.OPEN.id,
            label: nls.localizeByDefault('Open')
        });
        registry.registerMenuAction(ConstrainsContextMenu.NAVIGATION, {
            commandId: FileNavigatorCommands.OPEN_WITH.id,
            when: '!explorerResourceIsFolder',
            label: nls.localizeByDefault('Open With...')
        });

        registry.registerMenuAction(ConstrainsContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY.id,
            order: 'a'
        });
        registry.registerMenuAction(ConstrainsContextMenu.CLIPBOARD, {
            commandId: CommonCommands.PASTE.id,
            order: 'b'
        });
        registry.registerMenuAction(ConstrainsContextMenu.CLIPBOARD, {
            commandId: CommonCommands.COPY_PATH.id,
            order: 'c'
        });
        registry.registerMenuAction(ConstrainsContextMenu.CLIPBOARD, {
            commandId: WorkspaceCommands.COPY_RELATIVE_FILE_PATH.id,
            label: WorkspaceCommands.COPY_RELATIVE_FILE_PATH.label,
            order: 'd'
        });
        registry.registerMenuAction(ConstrainsContextMenu.CLIPBOARD, {
            commandId: FileDownloadCommands.COPY_DOWNLOAD_LINK.id,
            order: 'z'
        });

        registry.registerMenuAction(ConstrainsContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_RENAME.id,
            when: '!explorerResourceIsFolder'
        });
        registry.registerMenuAction(ConstrainsContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_DELETE.id,
            when: '!explorerResourceIsFolder'
        });
        registry.registerMenuAction(ConstrainsContextMenu.MODIFICATION, {
            commandId: WorkspaceCommands.FILE_DUPLICATE.id,
            when: '!explorerResourceIsFolder'
        });

        const downloadUploadMenu = [...CONSTRAINS_EXPLORER_CONTEXT_MENU, '6_downloadupload'];
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileSystemCommands.UPLOAD.id,
            order: 'a'
        });
        registry.registerMenuAction(downloadUploadMenu, {
            commandId: FileDownloadCommands.DOWNLOAD.id,
            order: 'b'
        });

        registry.registerMenuAction(ConstrainsContextMenu.COMPARE, {
            commandId: WorkspaceCommands.FILE_COMPARE.id
        });
        registry.registerMenuAction(ConstrainsContextMenu.MODIFICATION, {
            commandId: FileNavigatorCommands.COLLAPSE_ALL.id,
            label: nls.localizeByDefault('Collapse All'),
            order: 'z2'
        });

        registry.registerMenuAction(ConstrainsContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_FIRST.id,
            order: 'za'
        });
        registry.registerMenuAction(ConstrainsContextMenu.COMPARE, {
            commandId: NavigatorDiffCommands.COMPARE_SECOND.id,
            order: 'zb'
        });


        registry.registerMenuAction(ConstrainsContextMenu.MODIFICATION, {
            commandId: ConstrainsExplorerCommands.REMOVE_CONSTRAINS_SET.id,
            when: 'explorerResourceIsFolder'
        });



        registry.registerMenuAction(ConstrainsContextMenu.WORKSPACE, {
            commandId: ConstrainsExplorerCommands.NEW_CONSTAINS_FILE.id,
            when: 'explorerResourceIsFolder'
        });

        registry.registerMenuAction(ConstrainsContextMenu.WORKSPACE, {
            commandId: ConstrainsExplorerCommands.NEW_CONSTRAINS_SET.id
        });

        registry.registerMenuAction(ConstrainsContextMenu.STAGE, {
            commandId: ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_NONE.id,
            when: '!explorerResourceIsFolder'
        });

        registry.registerMenuAction(ConstrainsContextMenu.STAGE, {
            commandId: ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_SYNTH.id,
            when: '!explorerResourceIsFolder'
        });

        registry.registerMenuAction(ConstrainsContextMenu.STAGE, {
            commandId: ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_IMPL.id,
            when: '!explorerResourceIsFolder'
        });

        registry.registerMenuAction(ConstrainsContextMenu.STAGE, {
            commandId: ConstrainsExplorerCommands.CONSTRAINS_FILE_USE_SYNTH_IMPL.id,
            when: '!explorerResourceIsFolder'
        });

        registry.registerMenuAction(ConstrainsContextMenu.RUN, {
            commandId: ConstrainsExplorerCommands.FPGA_RUN_SYNTH_AND_IMPL_SELECTED.id,
            when: 'explorerResourceIsFolder'
        });

    }

    protected withConstrainsExplorerWidget<T>(widget: Widget | undefined, cb: (navigator: ConstrainsExplorerWidget) => T): T | false {
        if (widget instanceof ConstrainsExplorerWidget) {
            return cb(widget);
        }
        return false;
    }
  
    protected async validateFileName(name: string, parent: FileStat, allowNested: boolean = false): Promise<string> {
        if (!name) {
            return '';
        }
        // do not allow recursive rename
        if (!allowNested && !validFilename(name)) {
            return nls.localizeByDefault('The name **{0}** is not valid as a file or folder name. Please choose a different name.');
        }
        if (name.startsWith('/')) {
            return nls.localizeByDefault('A file or folder name cannot start with a slash.');
        } else if (name.startsWith(' ') || name.endsWith(' ')) {
            return nls.localizeByDefault('Leading or trailing whitespace detected in file or folder name.');
        }
        // check and validate each sub-paths
        if (name.split(/[\\/]/).some(file => !file || !validFilename(file) || /^\s+$/.test(file))) {
            return nls.localizeByDefault('\'{0}\' is not a valid file name', this.trimFileName(name));
        }
        const childUri = parent.resource.resolve(name);
        const exists = await this.fileService.exists(childUri);
        if (exists) {
            return nls.localizeByDefault('A file or folder **{0}** already exists at this location. Please choose a different name.', this.trimFileName(name));
        }
        return '';
    }

    protected trimFileName(name: string): string {
        if (name && name.length > 30) {
            return `${name.substring(0, 30)}...`;
        }
        return name;
    }

}