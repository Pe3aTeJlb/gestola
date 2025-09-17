import * as React from 'react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import {
  List,
  type ListImperativeAPI,
  type RowComponentProps
  } from "react-window";
import { messagesToLines, truncateLines } from './monitor-utils';

export type Line = { message: string; lineLen: number };
type RowProps = {
  lines: Line[];
};

export class SerialMonitorOutput extends React.Component<
  SerialMonitorOutput.Props,
  SerialMonitorOutput.State
> {
  /**
   * Do not touch it. It is used to be able to "follow" the serial monitor log.
   */
  protected toDisposeBeforeUnmount = new DisposableCollection();
  private listRef: React.RefObject<ListImperativeAPI>;

  constructor(props: Readonly<SerialMonitorOutput.Props>) {
    super(props);
    this.listRef = React.createRef();
    this.state = {
      lines: [],
      charCount: 0,
    };
  }
  

  override render(): React.ReactNode {
    return (
      <List<RowProps>
        rowComponent={this.RowComponent}
        rowCount={this.state.lines.length}
        rowHeight={20}
        rowProps={this.state}
        className="serial-monitor-messages"
        style={{ whiteSpace: 'nowrap' }}
        listRef={this.listRef}
      >
      </List>
    );
  }

  RowComponent(props: RowComponentProps<RowProps>) {
    return (
      (props.lines[props.index].lineLen && (
        <div style={props.style}>
          <pre>
            {props.lines[props.index].message}
          </pre>
        </div>
      )) ||
      null
    );
  };
  

  override shouldComponentUpdate(): boolean {
    return true;
  }

  override componentDidMount(): void {
    this.scrollToBottom();
    this.toDisposeBeforeUnmount.pushAll([
      this.props.transactionEvent((message:string) => {
        const [newLines, totalCharCount] = messagesToLines(
          [...message],
          this.state.lines,
          this.state.charCount
        );
        const [lines, charCount] = truncateLines(newLines, totalCharCount);
        this.setState(
          {
            lines,
            charCount,
          },
          () => this.scrollToBottom()
        );
      }),
      this.props.clearConsoleEvent(() =>
        this.setState({ lines: [], charCount: 0 })
      )
    ]);
  }

  override componentWillUnmount(): void {
    // TODO: "Your preferred browser's local storage is almost full." Discard `content` before saving layout?
    this.toDisposeBeforeUnmount.dispose();
  }

  private readonly scrollToBottom = () => {
    if (this.listRef.current && this.state.lines.length > 0) {
      this.listRef.current.scrollToRow({index: this.state.lines.length - 1});
    }
  };

}

export namespace SerialMonitorOutput {
  export interface Props {
    readonly transactionEvent: Event<string>;
    readonly clearConsoleEvent: Event<void>;
  }

  export interface State {
    lines: Line[];
    charCount: number;
  }

  export interface SelectOption<T> {
    readonly label: string;
    readonly value: T;
  }

  export const MAX_CHARACTERS = 1_000_000;
}