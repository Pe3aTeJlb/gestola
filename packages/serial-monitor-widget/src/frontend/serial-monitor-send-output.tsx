import * as React from 'react';
import { Event } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import {
  List,
  type ListImperativeAPI,
  type RowComponentProps
  } from "react-window";
import * as dateFormat from 'dateformat';
import { messagesToLines, truncateLines } from './monitor-utils';
import { SerialMonitorWatcher } from '@gestola/serial-monitor/lib/common/serial-monitor-watcher';

export type Line = { message: string; timestamp?: Date; lineLen: number };
type RowProps = {
  lines: Line[];
  timestamp: boolean;
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
      timestamp: this.props.timestamp,
      charCount: 0,
    };
  }
  

  override render(): React.ReactNode {
    return (
      <List<RowProps>
        rowComponent={this.RowComponent}
        rowCount={this.state.lines.length}
        rowHeight={30}
        rowProps={this.state}
        className="serial-monitor-messages"
        style={{ whiteSpace: 'nowrap' }}
        listRef={this.listRef}
      >
      </List>
    );
  }

  RowComponent(props: RowComponentProps<RowProps>) {
    const timestamp = props.timestamp ? `${dateFormat(props.lines[props.index].timestamp, 'HH:MM:ss.l')} -> ` : '';
    return (
      (props.lines[props.index].lineLen && (
        <div style={props.style}>
          <pre>
            {timestamp}
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
      this.props.proxy.onTransactionReceived((message:string) => {
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
            timestamp: this.props.timestamp,
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
    if (this.listRef.current && this.props.autoscroll && this.state.lines.length > 0) {
      this.listRef.current.scrollToRow({index: this.state.lines.length - 1});
    }
  };

}

export namespace SerialMonitorOutput {
  export interface Props {
    readonly autoscroll: boolean;
    readonly timestamp: boolean;
    readonly proxy: SerialMonitorWatcher;
    readonly clearConsoleEvent: Event<void>;
    readonly height: number;
  }

  export interface State {
    lines: Line[];
    timestamp: boolean;
    charCount: number;
  }

  export interface SelectOption<T> {
    readonly label: string;
    readonly value: T;
  }

  export const MAX_CHARACTERS = 1_000_000;
}
