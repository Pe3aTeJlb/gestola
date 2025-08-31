import * as React from 'react';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { DesignFLowEditorWidgetOptions } from './types';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import FlowComponent from './design-flow-component';

@injectable()
export class DesignFlowEditorWidget extends ReactWidget {

  static readonly ID = 'design-flow-editor:widget';
  static readonly LABEL = 'Gestola: Design Flow Editor';


  constructor(private readonly options?: DesignFLowEditorWidgetOptions) {
    super()
  }

  @postConstruct()
  protected init(): void {
      this.doInit()
  }

  protected async doInit(): Promise <void> {
    this.id = DesignFlowEditorWidget.ID;
    this.title.label = DesignFlowEditorWidget.LABEL;
    this.title.caption = DesignFlowEditorWidget.LABEL;
    this.title.closable = true;
    this.title.iconClass = 'fa fa-window-maximize'; // example widget icon.
    this.update();
}

  protected render(): React.ReactNode {
    return (
      <FlowComponent
        initialData={this.options?.initialData}
        onNodeDoubleClick={this.options?.onNodeDoubleClick}
        onSelectionChange={this.options?.onSelectionChange}
        widgetId={this.id}
      />
    );
  }

  protected override onActivateRequest(msg: any): void {
    super.onActivateRequest(msg);
    this.update();
  }
}