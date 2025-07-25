import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { MessageService } from '@theia/core';
import { Message, StatefulWidget } from '@theia/core/lib/browser';
import * as plotly from 'plotly.js';
import PlotlyEditor from "react-chart-editor";
import source from '../chart-editor/dataSources';

@injectable()
export class DataPreviewWidget extends ReactWidget implements StatefulWidget {

    static readonly ID = 'dashboard-editor-widget:data-preview';
    static readonly LABEL = 'Gestola: Dashboard Editor Data Preview';
    private dataSourceOptions = Object.keys(source).map((name) => ({
        value: name,
        label: name,
      }));
      
    private config = {editable: true};
    private state = {
        data: [] as any,
        layout: {} as any,
        frames: [] as any,
        currentMockIndex: -1,
        mocks: [],
      };

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    configure(){
    }

    @postConstruct()
    protected init(): void {
        this.doInit()
    }

    protected async doInit(): Promise <void> {
        this.id = DataPreviewWidget.ID;
        this.title.label = DataPreviewWidget.LABEL;
        this.title.caption = DataPreviewWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
        this.update();

    }

    render(): React.ReactElement {
        return <div>
        <PlotlyEditor
         data={this.state.data}
         layout={this.state.layout}
         config={this.config}
         frames={this.state.frames}
         dataSources={source}
         dataSourceOptions={this.dataSourceOptions}
         advancedTraceTypeSelector
          plotly={plotly}
          useResizeHandler={true}
          onUpdate={(data: any[], layout: Record<string, unknown>, frames: any[]) => {
            this.state.data = data;
            this.state.layout = layout;
            this.state.frames = frames;
            this.update();
        }}
        />
      </div>
    }

    storeState(): object | undefined {
        return {};
    }
    restoreState(oldState: object): void {
        throw new Error('Method not implemented.');
    }

    protected displayMessage(): void {
        this.messageService.info('Congratulations: Design Flow Editor Widget Successfully Created!');
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

}
