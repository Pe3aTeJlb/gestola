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
    private initItems: any[]  = [];
    private initItemId: number = 0;
    private template: [];
    private config = {editable: true, displaylogo: false};
    private state = {
        data: [] as any,
        layout: [{}] as any,
        frames: [] as any,
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
            this.initItems = [];
            await this.readData();
            await Promise.all(this.template.map(async(e) => this.processElement(e)));
            console.log('kek', this.state);
        }
        this.update();
    }

    public setDataset(table: string, data: Object[]){
        this.state.dataSourceName = table;
        this.state.dataSources = this.transposeArrayOfObjects(data);
        this.state.dataSourceOptions = Object.keys(this.state.dataSources).map((name) => ({
            value: name,
            label: name,
        }));

        this.update();
    }

    async readData(){
        let fileService = this.projManager.getFileSerivce();
        if(this.uri && await fileService.exists(this.uri)){
            this.template = JSON.parse((await fileService.read(this.uri)).value);
        }
    }

    private async processElement(el: any) {
     
        this.initItems.push({
            i: this.initItemId,
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
        });

        this.state.layout[this.initItemId] = el.template.layout;

        let buff = await this.projManager.getDatabaseService().executeQuery(`Select ${el.sqlColumns.join(',')} from ${el.dataSource} Limit 100;`);
        let dataset:any = this.transposeArrayOfObjects(buff);
        
        let data: any[] = [];
        let chartsDesc = Object.keys(el.template.data);

        for(let key of chartsDesc){
            for(let desc of el.template.data[key]){
                let columnsKeys = Object.keys(desc.meta.columnNames);
                let buff:any = {};
                for(let columnKey of columnsKeys){
                    buff[columnKey] = dataset[desc.meta.columnNames[columnKey]];
                }
                data.push(
                    {
                        ...desc,
                        type: key,
                        ...buff
                    }
                );
            }
        }

        this.state.data[this.initItemId] = data;
        this.initItemId += 1;

    }

    transposeArrayOfObjects<T extends Record<string, any>>(
        array: T[]
      ): { [K in keyof T]: T[K][] } {
        if (array.length === 0) return {} as { [K in keyof T]: T[K][] };
      
        // Get all unique keys from all objects
        const allKeys = Array.from(
          new Set(array.flatMap(obj => Object.keys(obj)))
        ) as (keyof T)[];
      
        // Initialize result object
        const result = {} as { [K in keyof T]: T[K][] };
      
        // Populate each key with array of values
        allKeys.forEach(key => {
          result[key] = array.map(obj => obj[key]);
        });
      
        return result;
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
                await this.fileService.write(fileUri, JSON.stringify(widgets));
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
        console.log('render');
        return (
        <PlotlyEditor
            initItemId={this.initItemId}
            initItems={this.initItems}
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
