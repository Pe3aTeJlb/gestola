import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService, URI } from '@theia/core';
import { Message } from '@theia/core/lib/browser';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import * as plotly from 'plotly.js';
const RGE = require('react-grid-layout');
const rce = require('@gestola/react-chart-editor');
const ReactGridLayout = RGE.WidthProvider(RGE);

export const NavigatableDashboardViewerOptions = Symbol('NavigatableDashboardViewerOptions');
export interface NavigatableDashboardViewerOptions {
    uri: URI;
}

@injectable()
export class DashboardViewerWidget extends ReactWidget {

    static readonly ID = 'dashboard-viewer:widget';
    static readonly LABEL = 'Gestola: Dashboard Viewer';
    
    public opt: NavigatableDashboardViewerOptions;
    public uri: URI;
    private template: [];
    private plots: any[];
    private PlotComponent: any;
    private config = {editable: false, displaylogo: false};

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;

    constructor(
        @inject(NavigatableDashboardViewerOptions) opts: NavigatableDashboardViewerOptions,
    ){
        super();
        if(opts){
            this.opt = opts;
            this.uri = opts.uri;
        }
    }

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise <void> {
        this.id = DashboardViewerWidget.ID;
        this.title.label = DashboardViewerWidget.LABEL;
        this.title.caption = DashboardViewerWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.PlotComponent = rce.createPlotComponent(plotly);
        await this.readData();
        this.plots = await Promise.all(this.template.map(async (e) => await this.createElement(e)));
        this.update();
    }

    async readData(){
        let fileService = this.projManager.getFileSerivce();
        if(await fileService.exists(this.uri)){
            this.template = JSON.parse((await fileService.read(this.uri)).value);
        }
    }

    private async createElement(el: any) {
     
        let gridItem = {
            i: el.i,
            x: el.x,
            y: el.y,
            w: el.w,
            h: el.h,
        };

        let dataset: any = await this.projManager.getDatabaseService().executeQuery(`Select ${el.sqlColumns.join(',')} from ${el.dataSource};`, true);
       
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

        return (
            <div key={gridItem.i} data-grid={gridItem} >
                <this.PlotComponent
                    data={data}
                    layout={{template: el.template}}
                    frames={[]}
                    config={this.config}
                    useResizeHandler={true}
                    onInitialized={this.update}
                    onUpdate={this.update}
                    style={{width: '100%', height: '100%'}}
                    divId={gridItem.i}
                />
            </div>
        );
    }

    render(): React.ReactElement {
        return (
            <ReactGridLayout
            cols={12}
            isDraggable={false}
            isResizable={false}
            isBounded={true}
            autoSize={true}
            onLayoutChange={this.update}
            style={{width: '100%', height: '100%'}}
            >
            {this.plots}
            </ReactGridLayout>
        );
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
