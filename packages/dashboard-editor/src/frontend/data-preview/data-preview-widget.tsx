import * as React from 'react';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message, StatefulWidget } from '@theia/core/lib/browser';
import DataTable, { TableColumn } from 'react-data-table-component';

@injectable()
export class DataPreviewWidget extends ReactWidget implements StatefulWidget {

    static readonly ID = 'dashboard-editor-widget:data-preview';
    static readonly LABEL = 'Gestola: Dashboard Editor Data Preview';

    private columns: TableColumn<Object>[];
    private data: Object[];

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

    public setData(data: Object[]){
        this.data = data;
        this.columns = Object.keys(data[0]).map(e => {
            return {
                name: e,
                selector: (row:any) => row[e]
            } as TableColumn<Object>
        });
        this.update();
    }

    render(): React.ReactElement {
        return (
            <DataTable
                columns={this.columns}
                data={this.data}
            />
        );
    }

    storeState(): object | undefined {
        return {};
    }
    restoreState(oldState: object): void {
        throw new Error('Method not implemented.');
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        const htmlElement = document.getElementById('displayMessageButton');
        if (htmlElement) {
            htmlElement.focus();
        }
    }

}
