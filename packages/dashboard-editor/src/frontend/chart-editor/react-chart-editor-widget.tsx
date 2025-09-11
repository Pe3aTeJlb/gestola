import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService } from '@theia/core';
import { Message, StatefulWidget } from '@theia/core/lib/browser';
import * as plotly from 'plotly.js';
import PlotlyEditor from "@gestola/react-chart-editor";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { FileSystemUtils } from '@theia/filesystem/lib/common';
import { WorkspaceInputDialog } from '@theia/workspace/lib/browser/workspace-input-dialog';
import { nls } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { LabelProvider } from '@theia/core/lib/browser';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { NavigatableDashboardEditorOptions } from '../base/navigatable-dashboard-editor-widget';
import { URI } from '@theia/core';
const validFilename: (arg: string) => boolean = require('valid-filename');

@injectable()
export class ChartEditorWidget extends ReactWidget implements StatefulWidget {
    
    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;

    @inject(FileService) 
    protected readonly fileService: FileService;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    static readonly ID = 'dashboard-editor-widget:chart-editor';
    static readonly LABEL = 'Gestola: Chart Editor';

    public opt: NavigatableDashboardEditorOptions;
    public uri: URI | undefined;
    private dashboardDescription: [];
    private config = {editable: true, displaylogo: false};
    private state = {
        data: [] as any,
        layout: [] as any,
        frames: [] as any,
        gridItems: [] as any,
        maxGridItemId: 0,
        dataSources: {},
        dataSourceOptions: [{}],
        dataSourceName: "",
      };

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    constructor(
        @inject(NavigatableDashboardEditorOptions)
        options: NavigatableDashboardEditorOptions,
    ){
        super();
        this.opt = options;
        this.uri = options.uri;
    }

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise <void> {
        this.id = ChartEditorWidget.ID;
        this.title.label = ChartEditorWidget.LABEL;
        this.title.caption = ChartEditorWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        if(this.uri){
            await this.readData();
            for(let e of this.dashboardDescription){
                await this.processElement(e);
            }
        }
        this.update();
    }

    public setDataset(table: string, data: Object[]){
        this.state.dataSourceName = table;
        this.state.dataSources = data;
        this.state.dataSourceOptions = Object.keys(this.state.dataSources).map((name) => ({
            value: name,
            label: name,
        }));
        this.update();
    }

    async readData(){
        let fileService = this.projManager.getFileSerivce();
        if(this.uri && await fileService.exists(this.uri)){
            this.dashboardDescription = JSON.parse((await fileService.read(this.uri)).value);
        }
    }

    private async processElement(el: any) {

        this.state.gridItems.push({
            i: this.state.maxGridItemId.toString(),
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
        });

        let dataset:any = await this.projManager.getDatabaseService().getReportSampleDataFor(el.dataSource, true);
        this.setDataset(el.dataSource, dataset);

        let data: any[] = el.data;
        let layout: any = el.layout;

        for(let trace of data){

            let columnsKeys = Object.keys(trace.meta.columnNames);
            for(let columnKey of columnsKeys){
                trace[columnKey] = dataset[trace.meta.columnNames[columnKey]];
            }

            for(let transform of trace.transforms){
                if(transform.target && transform.targetsrc){
                    transform.target = dataset[transform.targetsrc];
                }
            }

            trace.transforms = [
                ...[...Array(10)].map(() => ({
                    "type": "filter",
                    "target": [],
                    "targetsrc": "Technical filter, Do Not Delete",
                    "extra": "empty"
                })),
                ...trace.transforms
            ]

        }

        if(layout.updatemenus){
            let index = 0;
            for(let menu of layout.updatemenus){
                let distinctData = [...new Set(dataset[menu.source])];
                let filters: any[] = distinctData.map((e:any) => {
                    return {
                      label: `${menu.source}: ${e.toString()}`,
                      method: 'restyle',
                      args: [`transforms[${index}]`, {
                          type: 'filter',
                          target: dataset[menu.source],
                          targetsrc: menu.source,
                          operation: '=',
                          value: e,
                          extra: "technical"
                      }]
                    }
                  });
                menu.buttons = [
                    {
                      label: menu.source,
                      method: 'restyle',
                      args: [`transforms[${index}]`, {
                        type: "filter",
                        target: [],
                        targetsrc: menu.source,
                        extra: "technical"
                      }]
                    }, 
                    ...filters
                  ];
                index++;
            }
        }

        this.state.data[this.state.maxGridItemId] = data;
        this.state.layout[this.state.maxGridItemId] = layout;
        this.state.maxGridItemId = this.state.maxGridItemId + 1;

    }

    private async saveDashboard(widgets: any){
        const parent = await this.projManager.getCurrProject()!.dashboardsFstat();
        const parentUri = parent.resource;
        const targetUri = parentUri.resolve('Untitled');
        const vacantChildUri = FileSystemUtils.generateUniqueResourceURI(parent, targetUri, true);
        const dialog = new WorkspaceInputDialog({
            title: nls.localizeByDefault('New File...'),
            maxWidth: 400,
            parentUri: parentUri,
            initialValue: vacantChildUri.path.base,
            placeholder: nls.localize('theia/workspace/newFolderPlaceholder', 'File Name'),
            validate: name => this.validateFileName(name, parent, true)
        }, this.labelProvider);
        dialog.open().then(async name => {
            if (name) {
                const fileUri = parentUri.resolve(name+".dashboard");
                await this.fileService.createFile(fileUri);
                await this.fileService.write(fileUri, JSON.stringify(widgets, undefined, 2));
            }
        });

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

    render(): React.ReactElement {
        return (
        <PlotlyEditor
            gridItems={this.state.gridItems}
            data={this.state.data}
            layout={this.state.layout}
            config={this.config}
            frames={this.state.frames}
            dataSources={this.state.dataSources}
            dataSourceOptions={this.state.dataSourceOptions}
            dataSourceName={this.state.dataSourceName}
            plotly={plotly}
            useResizeHandler={true}
            onSaveDashboard={(widgets: any) => this.saveDashboard(widgets)}
            onPreviewDashboard={(widgets: any) => {console.log('widets', widgets)}}
            advancedTraceTypeSelector
        />
        );
    }

    storeState(): object | undefined {
        return {};
    }

    restoreState(oldState: object): void {
        throw new Error('Method not implemented.');
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: Dashboard Viewer Widget Successfully Created!');
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

}
