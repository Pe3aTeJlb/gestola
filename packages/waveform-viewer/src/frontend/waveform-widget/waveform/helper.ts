import { WaveformRenderer } from "./renderer";
import { ValueFormat } from "./value_format";

export type NetlistId = number;
export type SignalId  = number;
export type ValueChange = [number, string];
export type NetlistData = {
  signalId: number;
  signalName: string;
  modulePath: string;
  signalWidth: number;
  valueFormat: ValueFormat;
  vscodeContext: string;
  variableType: string;
  encoding: string;
  renderType: WaveformRenderer;
  colorIndex: number;
  color: string;
  formattedValues: string[];
  formatValid: boolean;
  wasRendered: boolean;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
};

export type WaveformData = {
  transitionData: any[];
  signalWidth: number;
  min: number;
  max: number;
};

export enum ActionType {
  MarkerSet,
  SignalSelect,
  Zoom,
  ReorderSignals,
  AddVariable,
  RemoveVariable,
  RedrawVariable,
  Resize,
  updateColorTheme,
}

export interface ViewerState {
  markerTime: number | null;
  altMarkerTime: number | null;
  selectedSignal: number | null;
  selectedSignalIndex: number | null;
  displayedSignals: number[];
  zoomRatio: number;
  scrollLeft: number;
  touchpadScrolling: boolean;
  autoTouchpadScrolling: boolean;
  mouseupEventType: string | null;
}


export class EventHandler {
  private subscribers: Map<ActionType, ((...args: any[]) => void)[]> = new Map();

  subscribe(action: ActionType, callback: (...args: any[]) => void) {
    if (!this.subscribers.has(action)) {
      this.subscribers.set(action, []);
    }
    this.subscribers.get(action)?.push(callback);
  }

  dispatch(action: ActionType, ...args: any[]) {
    this.subscribers.get(action)?.forEach((callback) => callback(...args));
  }
}

// Event handler helper functions
export function arrayMove(array: any[], fromIndex: number, toIndex: number) {
  const element = array[fromIndex];
  array.splice(fromIndex, 1);
  array.splice(toIndex, 0, element);
}