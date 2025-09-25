import { injectable, inject } from '@theia/core/shared/inversify';
import { ChartEditorWidget } from '@gestola/dashboard-editor/lib/frontend/chart-editor/react-chart-editor-widget';
import { NavigatableDashboardEditorOptions } from '@gestola/dashboard-editor/lib/frontend/base/navigatable-dashboard-editor-widget';

@injectable()
export class EDAChartEditorWidget extends ChartEditorWidget {

    override isEDA = true;

    constructor(
        @inject(NavigatableDashboardEditorOptions) options: NavigatableDashboardEditorOptions,
    ){
        super(options);
    }

}
