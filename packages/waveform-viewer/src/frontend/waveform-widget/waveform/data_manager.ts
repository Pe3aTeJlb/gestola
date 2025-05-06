import { NetlistData, SignalId, NetlistId, WaveformData, ActionType } from './helper';
import { formatBinary, formatHex, formatString, valueFormatList } from './value_format';
import { multiBitWaveformRenderer, binaryWaveformRenderer, linearWaveformRenderer, steppedrWaveformRenderer, signedLinearWaveformRenderer, signedSteppedrWaveformRenderer } from './renderer';
import { WaveformWidget } from '../waveform-widget';

export class WaveformDataManager {
  customColorKey = [];

  requested: SignalId[] = [];
  queued:    SignalId[] = [];
  requestActive: boolean = false;

  valueChangeData: WaveformData[] = [];
  netlistData: NetlistData[]      = [];
  valueChangeDataTemp: any        = [];

  contentArea: HTMLElement = document.getElementById('contentArea'+'-'+this.widget.widgetId)!;

  waveDromClock = {
    netlistId: null,
    edge: '1',
  };

  constructor(private widget: WaveformWidget) {
    this.contentArea = document.getElementById('contentArea'+'-'+this.widget.widgetId)!;

    if (this.contentArea === null) {throw new Error("Could not find contentArea");}

    this.handleColorChange = this.handleColorChange.bind(this);
    this.widget.events.subscribe(ActionType.updateColorTheme, this.handleColorChange);
  }

  unload() {
    this.valueChangeData     = [];
    this.netlistData         = [];
    this.valueChangeDataTemp = {};
    this.waveDromClock       = {netlistId: null, edge: ""};
  }

  // This is a simple queue to handle the fetching of waveform data
  // It's overkill for everything except large FST waveform dumps with lots of
  // Value Change Blocks. Batch fetching is much faster than individual fetches,
  // so this queue will ensure that fetches are grouped while waiting for any
  // previous fetches to complete.
  request(signalIdList: SignalId[]) {
    this.queued = this.queued.concat(signalIdList);
    this.fetch();
  }

  receive(signalId: SignalId) {
    this.requested = this.requested.filter((id) => id !== signalId);
    if (this.requested.length === 0) {
      this.requestActive = false;
      this.fetch();
    }
  }

  private fetch() {
    
    if (this.requestActive) {return;}
    if (this.queued.length === 0) {return;}

    this.requestActive = true;
    this.requested     = this.queued;
    this.queued        = [];
    this.widget.waveformViewerBackendService.getSignalData(this.widget.options.uri, this.requested);

  }

  addVariable(signalList: any) {
    // Handle rendering a signal, e.g., render the signal based on message content
    //console.log(message);

    if (signalList.length === 0) {return;}

    let updateFlag     = false;
    let selectedSignal = this.widget.viewerState.selectedSignal;

    const signalIdList: any  = [];
    const netlistIdList: any = [];
    signalList.forEach((signal: any) => {

      const netlistId = signal.netlistId;
      const signalId  = signal.signalId;

      let valueFormat;
      let colorIndex = 0;
      if (signal.encoding === "String") {
        valueFormat = formatString;
        colorIndex  = 1;
      } else if (signal.encoding === "Real") {
        valueFormat = formatString;
      } else {
        valueFormat = signal.signalWidth === 1 ? formatBinary : formatHex;
      }

      this.netlistData[netlistId] = {
        signalId:     signalId,
        signalWidth:  signal.signalWidth,
        signalName:   signal.signalName,
        modulePath:   signal.modulePath,
        variableType: signal.type,
        encoding:     signal.encoding,
        vscodeContext: "",
        valueFormat:  valueFormat,
        renderType:   signal.signalWidth === 1 ? binaryWaveformRenderer : multiBitWaveformRenderer,
        colorIndex:   colorIndex,
        color:        "",
        wasRendered:  false,
        formattedValues: [],
        formatValid:  false,
        canvas:       null,
        ctx:          null,
      };

      this.netlistData[netlistId].vscodeContext = this.setSignalContextAttribute(netlistId);
      this.setColorFromColorIndex(this.netlistData[netlistId]);
      netlistIdList.push(netlistId);

      if (this.valueChangeData[signalId] !== undefined) {
        selectedSignal = netlistId;
        updateFlag     = true;
        this.cacheValueFormat(this.netlistData[netlistId]);
      } else if (this.valueChangeDataTemp[signalId] !== undefined) {
        this.valueChangeDataTemp[signalId].netlistIdList.push(netlistId);
      } else if (this.valueChangeDataTemp[signalId] === undefined) {
        signalIdList.push(signalId);
        this.valueChangeDataTemp[signalId] = {
          netlistIdList: [netlistId],
          totalChunks: 0,
        };
      }
    });

    this.request(signalIdList);
    this.widget.viewerState.displayedSignals = this.widget.viewerState.displayedSignals.concat(netlistIdList);
    this.widget.events.dispatch(ActionType.AddVariable, netlistIdList, updateFlag);
    this.widget.events.dispatch(ActionType.SignalSelect, selectedSignal);

    //sendWebviewContext();
  }

  updateWaveformChunk(message: any) {

    const signalId = message.signalId;
    if (this.valueChangeDataTemp[signalId].totalChunks === 0) {
      this.valueChangeDataTemp[signalId].totalChunks = message.totalChunks;
      this.valueChangeDataTemp[signalId].chunkLoaded = new Array(message.totalChunks).fill(false);
      this.valueChangeDataTemp[signalId].chunkData   = new Array(message.totalChunks).fill("");
    }

    this.valueChangeDataTemp[signalId].chunkData[message.chunkNum]   = message.transitionDataChunk;
    this.valueChangeDataTemp[signalId].chunkLoaded[message.chunkNum] = true;
    const allChunksLoaded = this.valueChangeDataTemp[signalId].chunkLoaded.every((chunk: any) => {return chunk;});

    if (!allChunksLoaded) {return;}

    //console.log('all chunks loaded');

    this.receive(signalId);

    const transitionData = JSON.parse(this.valueChangeDataTemp[signalId].chunkData.join(""));
    this.updateWaveform(signalId, transitionData, message.min, message.max);

  }

  //updateWaveformFull(message: any) {
  //  const signalId = message.signalId;
  //  this.receive(signalId);
//
  //  const transitionData = message.transitionData;
  //  this.updateWaveform(signalId, transitionData, message.min, message.max);
  //}

  updateWaveform(signalId: SignalId, transitionData: any[], min: number, max: number) {
    const netlistIdList = this.valueChangeDataTemp[signalId].netlistIdList;
    const netlistId     = netlistIdList[0];
    if (netlistId ===  undefined) {console.log('netlistId not found for signalId ' + signalId); return;}
    const signalWidth  = this.netlistData[netlistId].signalWidth;
    const nullValue = "x".repeat(signalWidth);
    if (transitionData[0][0] !== 0) {
      transitionData.unshift([0, nullValue]);
    }
    if (transitionData[transitionData.length - 1][0] !== this.widget.viewport.timeStop) {
      transitionData.push([this.widget.viewport.timeStop, nullValue]);
    }
    this.valueChangeData[signalId] = {
      transitionData: transitionData,
      signalWidth:    signalWidth,
      min:            min,
      max:            max,
    };

    this.valueChangeDataTemp[signalId] = undefined;

    netlistIdList.forEach((netlistId: NetlistId) => {
      this.widget.events.dispatch(ActionType.RedrawVariable, netlistId);
      this.cacheValueFormat(this.netlistData[netlistId]);
    });

  }

  // binary searches for a value in an array. Will return the index of the value if it exists, or the lower bound if it doesn't
  binarySearch(array: any[], target: number) {
    let low  = 0;
    let high = array.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (array[mid][0] < target) {low = mid + 1;}
      else {high = mid;}
    }
    return low;
  }

  setColorFromColorIndex(netlistData: NetlistData | undefined) {
    if (netlistData === undefined) {return;}
    const colorIndex = netlistData.colorIndex;
    if (colorIndex < 4) {
      netlistData.color = this.widget.viewport.colorKey[colorIndex];
    } else {
      netlistData.color = this.customColorKey[colorIndex - 4];
    }
  }

  handleColorChange() {
    this.widget.viewport.getThemeColors();
    this.netlistData.forEach((data) => {
      this.setColorFromColorIndex(data);
    });
  }

  async cacheValueFormat(netlistData: NetlistData) {
    return new Promise<void>((resolve) => {
      const valueChangeData = this.valueChangeData[netlistData.signalId];
      if (valueChangeData === undefined)            {resolve(); return;}
      if (netlistData.renderType.id !== "multiBit") {resolve(); return;}
      if (netlistData.formatValid)                  {resolve(); return;}

      netlistData.formattedValues = valueChangeData.transitionData.map(([, value]) => {
        const is9State = netlistData.valueFormat.is9State(value);
        return netlistData.valueFormat.formatString(value, netlistData.signalWidth, !is9State);
      });
      netlistData.formatValid = true;
      resolve();
      return;
    });
  }

  setDisplayFormat(message: any) {

    const netlistId = message.netlistId;
    if (message.netlistId === undefined) {return;}
    if (this.netlistData[netlistId] === undefined) {return;}
    const netlistData = this.netlistData[netlistId];

    if (message.numberFormat !== undefined) {
      let valueFormat = valueFormatList.find((format) => format.id === message.numberFormat);
      if (valueFormat === undefined) {valueFormat = formatBinary;}
      netlistData.formatValid = false;
      netlistData.formattedValues = [];
      netlistData.valueFormat = valueFormat;
      this.cacheValueFormat(netlistData);
    }

    if (message.color !== undefined) {
      this.customColorKey = message.customColors;
      netlistData.colorIndex = message.color;
      this.setColorFromColorIndex(netlistData);
    }

    if (message.renderType !== undefined) {
      switch (message.renderType) {
        case "binary":        netlistData.renderType = binaryWaveformRenderer; break;
        case "multiBit":      netlistData.renderType = multiBitWaveformRenderer; break;
        case "linear":        netlistData.renderType = linearWaveformRenderer; break;
        case "stepped":       netlistData.renderType = steppedrWaveformRenderer; break;
        case "linearSigned":  netlistData.renderType = signedLinearWaveformRenderer; break;
        case "steppedSigned": netlistData.renderType = signedSteppedrWaveformRenderer; break;
        default:              netlistData.renderType = multiBitWaveformRenderer; break;
      }

      if (netlistData.renderType.id === "multiBit") {
        this.cacheValueFormat(netlistData);
      }
    }

    //sendWebviewContext();

    this.netlistData[netlistId].vscodeContext = this.setSignalContextAttribute(netlistId);
    this.widget.events.dispatch(ActionType.RedrawVariable, netlistId);
  }

  setSignalContextAttribute(netlistId: NetlistId) {
    const width        = this.netlistData[netlistId].signalWidth;
    const modulePath   = this.netlistData[netlistId].modulePath;
    const signalName   = this.netlistData[netlistId].signalName;
    //const attribute    = `data-vscode-context=${JSON.stringify({
      const attribute    = `${JSON.stringify({
      webviewSection: "signal",
      modulePath: modulePath,
      signalName: signalName,
      type: this.netlistData[netlistId].variableType,
      width: width,
      preventDefaultContextMenuItems: true,
      netlistId: netlistId,
    }).replace(/\s/g, '%x20')}`;
    return attribute;
  }

  getNearestTransitionIndex(signalId: SignalId, time: number) {

    if (time === null) {return -1;}
  
    const data            = this.valueChangeData[signalId].transitionData;
    const transitionIndex = this.binarySearch(data, time);
  
    if (transitionIndex >= data.length) {
      console.log('search found a -1 index');
      return -1;
    }
  
    return transitionIndex;
  }

  getValueAtTime(netlistId: NetlistId, time: number) {

    const result: string[] = [];
    const signalId = this.netlistData[netlistId].signalId;
    const data     = this.valueChangeData[signalId];
  
    if (!data) {return result;}
  
    const transitionData  = data.transitionData;
    const transitionIndex = this.getNearestTransitionIndex(signalId, time);

    if (transitionIndex === -1) {return result;}
    if (transitionIndex > 0) {
      result.push(transitionData[transitionIndex - 1][1]);
    }
  
    if (transitionData[transitionIndex][0] === time) {
      result.push(transitionData[transitionIndex][1]);
    }
  
    return result;
  }

  getNearestTransition(netlistId: NetlistId, time: number) {

    const signalId = this.netlistData[netlistId].signalId;
    const result = null;
    if (time === null) {return result;}

    const data  = this.valueChangeData[signalId].transitionData;
    const index = this.getNearestTransitionIndex(signalId, time);
    
    if (index === -1) {return result;}
    if (data[index][0] === time) {
      return data[index];
    }
  
    const timeBefore = time - data[index - 1][0];
    const timeAfter  = data[index][0] - time;
  
    if (timeBefore < timeAfter) {
      return data[index - 1];
    } else {
      return data[index];
    }
  }
}