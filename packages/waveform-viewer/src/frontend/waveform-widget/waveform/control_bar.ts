import { WaveformWidget } from '../waveform-widget';
import {ActionType, EventHandler, NetlistId} from './helper';

enum ButtonState {
  Disabled = 0,
  Enabled  = 1,
  Selected = 2
}

enum SearchState {
  Time  = 0,
  Value = 1
}

export class ControlBar {
  private zoomInButton: HTMLElement;
  private zoomOutButton: HTMLElement;
  private prevNegedge: HTMLElement;
  private prevPosedge: HTMLElement;
  private nextNegedge: HTMLElement;
  private nextPosedge: HTMLElement;
  private prevEdge: HTMLElement;
  private nextEdge: HTMLElement;
  private timeEquals: HTMLElement;
  private valueEquals: HTMLElement;
  private valueEqualsSymbol: HTMLElement;
  private previousButton: HTMLElement;
  private nextButton: HTMLElement;
  private autoScroll: HTMLElement;
  private touchScroll: HTMLElement;
  private mouseScroll: HTMLElement;

  private searchContainer: any;
  private searchBar: any;
  private valueIconRef: any;

  // Search handler variables
  searchState         = SearchState.Time;
  searchInFocus       = false;

  private widget: WaveformWidget;
  private events: EventHandler;

  parsedSearchValue: string | null = null;

  constructor(widget: WaveformWidget) {
    this.widget = widget;
    this.events = this.widget.events;

    this.zoomInButton  = document.getElementById('zoom-in-button'+'-'+this.widget.widgetId)!;
    this.zoomOutButton = document.getElementById('zoom-out-button'+'-'+this.widget.widgetId)!;
    this.prevNegedge   = document.getElementById('previous-negedge-button'+'-'+this.widget.widgetId)!;
    this.prevPosedge   = document.getElementById('previous-posedge-button'+'-'+this.widget.widgetId)!;
    this.nextNegedge   = document.getElementById('next-negedge-button'+'-'+this.widget.widgetId)!;
    this.nextPosedge   = document.getElementById('next-posedge-button'+'-'+this.widget.widgetId)!;
    this.prevEdge      = document.getElementById('previous-edge-button'+'-'+this.widget.widgetId)!;
    this.nextEdge      = document.getElementById('next-edge-button'+'-'+this.widget.widgetId)!;
    this.timeEquals    = document.getElementById('time-equals-button'+'-'+this.widget.widgetId)!;
    this.valueEquals   = document.getElementById('value-equals-button'+'-'+this.widget.widgetId)!;
    this.valueEqualsSymbol = document.getElementById('search-symbol'+'-'+this.widget.widgetId)!;
    this.previousButton = document.getElementById('previous-button'+'-'+this.widget.widgetId)!;
    this.nextButton    = document.getElementById('next-button'+'-'+this.widget.widgetId)!;
    this.autoScroll    = document.getElementById('auto-scroll-button'+'-'+this.widget.widgetId)!;
    this.touchScroll   = document.getElementById('touchpad-scroll-button'+'-'+this.widget.widgetId)!;
    this.mouseScroll   = document.getElementById('mouse-scroll-button'+'-'+this.widget.widgetId)!;
    this.searchContainer = document.getElementById('search-container'+'-'+this.widget.widgetId)!;
    this.searchBar     = document.getElementById('search-bar'+'-'+this.widget.widgetId)!;
    this.valueIconRef  = document.getElementById('value-icon-reference'+'-'+this.widget.widgetId)!;

    if (this.zoomInButton === null || this.zoomOutButton === null || this.prevNegedge === null ||
        this.prevPosedge === null || this.nextNegedge === null || this.nextPosedge === null ||
        this.prevEdge === null || this.nextEdge === null || this.timeEquals === null ||
        this.valueEquals === null || this.previousButton === null || this.nextButton === null ||
        this.touchScroll === null || this.mouseScroll === null || this.autoScroll === null ||
        this.searchContainer === null || this.searchBar === null || this.valueIconRef === null || 
        this.valueEqualsSymbol === null) {
      throw new Error("Could not find all required elements");
    }

    // Control bar button event handlers
    this.zoomInButton.addEventListener( 'click', (e) => {this.events.dispatch(ActionType.Zoom, -1, (this.widget.viewport.pseudoScrollLeft + this.widget.viewport.halfViewerWidth) / this.widget.viewport.zoomRatio, this.widget.viewport.halfViewerWidth);});
    this.zoomOutButton.addEventListener('click', (e) => {this.events.dispatch(ActionType.Zoom, 1, (this.widget.viewport.pseudoScrollLeft + this.widget.viewport.halfViewerWidth) / this.widget.viewport.zoomRatio, this.widget.viewport.halfViewerWidth);});
    this.prevNegedge.addEventListener(  'click', (e: any) => {this.goToNextTransition(-1, '0');});
    this.prevPosedge.addEventListener(  'click', (e: any) => {this.goToNextTransition(-1, '1');});
    this.nextNegedge.addEventListener(  'click', (e: any) => {this.goToNextTransition( 1, '0');});
    this.nextPosedge.addEventListener(  'click', (e: any) => {this.goToNextTransition( 1, '1');});
    this.prevEdge.addEventListener(     'click', (e: any) => {this.goToNextTransition(-1);});
    this.nextEdge.addEventListener(     'click', (e: any) => {this.goToNextTransition( 1);});

    // Search bar event handlers
    this.searchBar.addEventListener(     'focus', (e: any) => {this.handleSearchBarInFocus(true);});
    this.searchBar.addEventListener(      'blur', (e: any) => {this.handleSearchBarInFocus(false);});
    this.searchBar.addEventListener(   'keydown', (e: any) => {this.handleSearchBarKeyDown(e);});
    this.searchBar.addEventListener(     'keyup', (e: any) => {this.handleSearchBarEntry(e);});
    this.timeEquals.addEventListener(    'click', (e: any) => {this.handleSearchButtonSelect(0);});
    this.valueEquals.addEventListener(   'click', (e: any) => {this.handleSearchButtonSelect(1);});
    this.previousButton.addEventListener('click', (e: any) => {this.handleSearchGoTo(-1);});
    this.nextButton.addEventListener(    'click', (e: any) => {this.handleSearchGoTo(1);});
  
    this.autoScroll.addEventListener(   'click', (e: any) => {this.handleAutoScroll();});
    this.touchScroll.addEventListener(   'click', (e: any) => {this.handleTouchScroll(true);});
    this.mouseScroll.addEventListener(   'click', (e: any) => {this.handleTouchScroll(false);});

    this.setButtonState(this.previousButton, ButtonState.Disabled);
    this.setButtonState(this.mouseScroll, ButtonState.Selected);
    this.updateButtonsForSelectedWaveform(null);

    this.handleSignalSelect = this.handleSignalSelect.bind(this);
    this.handleRedrawVariable = this.handleRedrawVariable.bind(this);
    this.handleMarkerSet = this.handleMarkerSet.bind(this);

    this.events.subscribe(ActionType.SignalSelect, this.handleSignalSelect);
    this.events.subscribe(ActionType.RedrawVariable, this.handleRedrawVariable);
    this.events.subscribe(ActionType.MarkerSet, this.handleMarkerSet);
  }

  goToNextTransition(direction: number, edge: string | undefined = undefined) {
    if (this.widget.viewerState.selectedSignal === null) {
      return;
    }

    if (this.widget.viewerState.markerTime === null) {return;}
  
    const signalId = this.widget.dataManager.netlistData[this.widget.viewerState.selectedSignal].signalId;
    const data     = this.widget.dataManager.valueChangeData[signalId];
    const time     = this.widget.viewerState.markerTime;
    let timeIndex;
    let indexIncrement;
  
    if (edge === undefined) {
      timeIndex = data.transitionData.findIndex(([t, v]) => {return t >= time;});
      indexIncrement = 1;
    } else {
      timeIndex = data.transitionData.findIndex(([t, v]) => {return t >= time && v === edge;});
      indexIncrement = 2;
    }
  
    if (timeIndex === -1) {
      //console.log('search found a -1 index');
      return;
    }
  
    if ((direction === 1) && (time === data.transitionData[timeIndex][0])) {timeIndex += indexIncrement;}
    else if (direction === -1) {timeIndex -= indexIncrement;}
  
    timeIndex = Math.max(timeIndex, 0);
    timeIndex = Math.min(timeIndex, data.transitionData.length - 1);
  
    this.events.dispatch(ActionType.MarkerSet, data.transitionData[timeIndex][0], 0);
  }

  handleTouchScroll(state: boolean) {
    this.widget.viewerState.touchpadScrolling = state;
    this.widget.viewerState.autoTouchpadScrolling = false;
    if (state) {
      this.setButtonState(this.mouseScroll, ButtonState.Enabled);
      this.setButtonState(this.touchScroll, ButtonState.Selected);
    } else {
      this.setButtonState(this.mouseScroll, ButtonState.Selected);
      this.setButtonState(this.touchScroll, ButtonState.Enabled);
    }
    this.setButtonState(this.autoScroll, ButtonState.Enabled);
  }

  handleAutoScroll() {
    this.widget.viewerState.autoTouchpadScrolling = true;
    this.setButtonState(this.mouseScroll, ButtonState.Enabled);
    this.setButtonState(this.touchScroll, ButtonState.Enabled);
    this.setButtonState(this.autoScroll, ButtonState.Selected);
  }

  setButtonState(buttonId: any, state: number) {
    if (state === ButtonState.Disabled) {
      buttonId.classList.remove('selected-button');
      buttonId.classList.add('disabled-button');
    } else if (state === ButtonState.Enabled) {
      buttonId.classList.remove('disabled-button');
      buttonId.classList.remove('selected-button');
    } else if (state === ButtonState.Selected) {
      buttonId.classList.remove('disabled-button');
      buttonId.classList.add('selected-button');
    }
  }

  setBinaryEdgeButtons(selectable: number) {
    this.setButtonState(this.prevNegedge, selectable);
    this.setButtonState(this.prevPosedge, selectable);
    this.setButtonState(this.nextNegedge, selectable);
    this.setButtonState(this.nextPosedge, selectable);
  }

  setBusEdgeButtons(selectable: number) {
    this.setButtonState(this.prevEdge, selectable);
    this.setButtonState(this.nextEdge, selectable);
  }

  updateButtonsForSelectedWaveform(width: number | null) {
    if (width === null) {
      this.setBinaryEdgeButtons(ButtonState.Disabled);
      this.setBusEdgeButtons(ButtonState.Disabled);
    } else if (width === 1) {
      this.setBinaryEdgeButtons(ButtonState.Enabled);
      this.setBusEdgeButtons(ButtonState.Enabled);
    } else {
      this.setBinaryEdgeButtons(ButtonState.Disabled);
      this.setBusEdgeButtons(ButtonState.Enabled);
    }
  }

  handleSearchButtonSelect(button: number) {
    this.handleSearchBarInFocus(true);
    this.searchState = button;
    if (this.searchState === SearchState.Time) {
      this.setButtonState(this.timeEquals, ButtonState.Selected);
      this.setButtonState(this.valueEquals, ButtonState.Enabled);
    } else if (this.searchState === SearchState.Value) {
      this.setButtonState(this.timeEquals, ButtonState.Enabled);
      this.setButtonState(this.valueEquals, ButtonState.Selected);
    }
    this.handleSearchBarEntry({key: 'none'});
  }

  checkValidTimeString(inputText: string) {
    if (inputText.match(/^[0-9]+$/)) {
      this.parsedSearchValue = inputText.replace(/,/g, '');
      return true;
    }
    else {return false;}
  }

  handleSearchBarKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSearchGoTo(1);
      return;
    }
  }
  
  handleSearchBarEntry(event: any) {
    const inputText  = this.searchBar.value;
    let inputValid   = true;
    //console.log(viewerState.selectedSignal);
    //console.log(this.searchState);
    if (this.widget.viewerState.selectedSignal !== null) {
      const format = this.widget.dataManager.netlistData[this.widget.viewerState.selectedSignal].valueFormat;
      const checkValid = format.checkValid;
      const parseValue = format.parseValueForSearch;
  
      // check to see that the input is valid
      if (this.searchState === SearchState.Time) {
        inputValid = this.checkValidTimeString(inputText);
      } else if (this.searchState === SearchState.Value) {
        inputValid = checkValid(inputText);
        if (inputValid) {this.parsedSearchValue = parseValue(inputText);}
        //console.log(inputValid);
        //console.log(this.parsedSearchValue);
      }
    }
  
    // Update UI accordingly
    if (inputValid || inputText === '') {
      this.searchContainer.classList.remove('is-invalid');
    } else {
      this.searchContainer.classList.add('is-invalid');
    }
  
    if (inputValid && inputText !== '') {
      this.setButtonState(this.previousButton, this.searchState);
      this.setButtonState(this.nextButton, ButtonState.Enabled);
    } else {
      this.setButtonState(this.previousButton, ButtonState.Disabled);
      this.setButtonState(this.nextButton, ButtonState.Disabled);
    }
  }
  
  handleSearchGoTo(direction: number) {
    if (this.widget.viewerState.selectedSignal === null) {return;}
    if (this.parsedSearchValue === null) {return;}
    let startTime = this.widget.viewerState.markerTime ? this.widget.viewerState.markerTime : 0;
  
    const signalId = this.widget.dataManager.netlistData[this.widget.viewerState.selectedSignal].signalId;
  
    if (this.searchState === SearchState.Time && direction === 1) {
      this.events.dispatch(ActionType.MarkerSet, parseInt(this.parsedSearchValue), 0);
    } else {
      const signalWidth      = this.widget.dataManager.valueChangeData[signalId].signalWidth;
      let trimmedSearchValue = this.parsedSearchValue;
      if (this.parsedSearchValue.length > signalWidth) {trimmedSearchValue = this.parsedSearchValue.slice(-1 * signalWidth);}
      const searchRegex = new RegExp(trimmedSearchValue, 'ig');
      const data      = this.widget.dataManager.valueChangeData[signalId];
      const timeIndex = data.transitionData.findIndex(([t, v]) => {return t >= startTime;});
      let indexOffset = 0;
  
      if (direction === -1) {indexOffset = -1;}
      else if (this.widget.viewerState.markerTime === data.transitionData[timeIndex][0]) {indexOffset = 1;}
  
      for (let i = timeIndex + indexOffset; i >= 0; i+=direction) {
        if (data.transitionData[i][1].match(searchRegex)) {
          this.events.dispatch(ActionType.MarkerSet, data.transitionData[i][0], 0);
          break;
        }
      }
    }
  }

  handleSearchBarInFocus(isFocused: boolean) {
    this.searchInFocus = isFocused;
    if (isFocused) {
      if (document.activeElement !== this.searchBar) {
        this.searchBar.focus();
      }
      if (this.searchContainer.classList.contains('is-focused')) {return;}
      this.searchContainer.classList.add('is-focused');
    } else {
      this.searchContainer.classList.remove('is-focused');
    }
  }

  handleSignalSelect(netlistId: NetlistId) {
    if (netlistId === null || netlistId === undefined) {
      this.updateButtonsForSelectedWaveform(null);
      return;
    }

    this.updateButtonsForSelectedWaveform(this.widget.dataManager.netlistData[netlistId].signalWidth);
    this.valueEqualsSymbol.textContent = this.widget.dataManager.netlistData[netlistId]?.valueFormat.symbolText;
  }

  handleRedrawVariable(netlistId: NetlistId) {
    if (netlistId === this.widget.viewerState.selectedSignal) {
      this.valueEqualsSymbol.textContent = this.widget.dataManager.netlistData[netlistId]?.valueFormat.symbolText;
    }
  }

  handleMarkerSet(time: number, markerType: number) {
    if (this.searchState === SearchState.Time) {
      this.searchBar.value = time;
      this.searchContainer.classList.remove('is-invalid');
    }
  }

}