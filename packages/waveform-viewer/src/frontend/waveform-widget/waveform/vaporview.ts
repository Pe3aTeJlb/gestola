import { WaveformWidget } from '../waveform-widget';
import { ActionType, NetlistId } from './helper';

export class VaporviewWebview {

  // HTML Elements
  webview: HTMLElement;
  labelsScroll: HTMLElement;
  transitionScroll: HTMLElement;
  scrollArea: HTMLElement;
  contentArea: HTMLElement;
  scrollbar: HTMLElement;

  widget: WaveformWidget;

  lastIsTouchpad: boolean = false;
  touchpadCheckTimer: any = 0;

  resizeDebounce: any = 0;

  constructor(
    widget: WaveformWidget, 
  ) {
    this.widget = widget;
    // Assuming you have a reference to the webview element
    const webview           = document.getElementById('vaporview-top'+'-'+this.widget.widgetId);
    const labelsScroll      = document.getElementById('waveform-labels-container'+'-'+this.widget.widgetId);
    const transitionScroll  = document.getElementById('transition-display-container'+'-'+this.widget.widgetId);
    const scrollArea        = document.getElementById('scrollArea'+'-'+this.widget.widgetId);
    const contentArea       = document.getElementById('contentArea'+'-'+this.widget.widgetId);
    const scrollbar         = document.getElementById('scrollbar'+'-'+this.widget.widgetId);

    if (webview === null || labelsScroll === null || transitionScroll === null ||
      scrollArea === null || contentArea === null || scrollbar === null) {
      throw new Error("Could not find all required elements");
    }

    this.webview          = webview;
    this.labelsScroll     = labelsScroll;
    this.transitionScroll = transitionScroll;
    this.scrollArea       = scrollArea;
    this.contentArea      = contentArea;
    this.scrollbar        = scrollbar;

    webview.style.gridTemplateColumns = `150px 50px auto`;
 
    // #region Primitive Handlers
    window.addEventListener('message', (e) => {this.handleMessage(e);});
    window.addEventListener('keydown', (e) => {this.keyDownHandler(e);});
    window.addEventListener('mouseup', (e) => {this.handleMouseUp(e);});
    window.addEventListener('resize',  ()  => {this.handleResizeViewer();}, false);
    this.scrollArea.addEventListener(      'wheel', (e) => {this.scrollHandler(e);});
    this.scrollArea.addEventListener(      'scroll', () => {this.handleViewportScroll();});
    this.labelsScroll.addEventListener(    'wheel', (e) => {this.syncVerticalScroll(e, labelsScroll.scrollTop);});
    this.transitionScroll.addEventListener('wheel', (e) => {this.syncVerticalScroll(e, transitionScroll.scrollTop);});

    this.handleMarkerSet          = this.handleMarkerSet.bind(this);
    this.handleSignalSelect       = this.handleSignalSelect.bind(this);
    this.reorderSignals           = this.reorderSignals.bind(this);

    this.widget.events.subscribe(ActionType.MarkerSet, this.handleMarkerSet);
    this.widget.events.subscribe(ActionType.SignalSelect, this.handleSignalSelect);
    this.widget.events.subscribe(ActionType.ReorderSignals, this.reorderSignals);
  }

  // Function to test whether or not the user is using a touchpad
  // Sometimes it returns false negatives when flicking the touchpad,
  // hence the timer to prevent multiple checks in a short period of time
  isTouchpad(e: any) {

    if (performance.now() < this.touchpadCheckTimer) {
      return this.lastIsTouchpad;
    }

    if (e.wheelDeltaY) {
      if (e.wheelDeltaY === (e.deltaY * -3)) {
        this.lastIsTouchpad = true;
        return true;
      }
    //} else if (e.wheelDeltaX && !e.shiftKey) {
    //  if (e.wheelDeltaX === (e.deltaX * -3)) {
    //    this.lastIsTouchpad = true;
    //    return true;
    //  }
    } else if (e.deltaMode === 0) {
      this.lastIsTouchpad = true;
      return true;
    }
    this.lastIsTouchpad = false;
    return false;
  }

  scrollHandler(e: any) {
    e.preventDefault();
    //console.log(event);


    //if (!isTouchpad) {e.preventDefault();}

    const deltaY = e.deltaY;
    const deltaX = e.deltaX;
    const touchpadScrollDivisor = 18;
    const mouseMode = !this.widget.viewerState.autoTouchpadScrolling && !this.widget.viewerState.touchpadScrolling;

    if (e.shiftKey) {
      e.stopPropagation();
      this.scrollArea.scrollTop      += deltaY || deltaX;
      this.labelsScroll.scrollTop     = this.scrollArea.scrollTop;
      this.transitionScroll.scrollTop = this.scrollArea.scrollTop;
    } else if (e.ctrlKey) {
      if      (this.widget.viewport.updatePending) {return;}
      // Touchpad mode detection returns false positives with pinches, so we
      // just clamp the deltaY value to prevent zooming in/out too fast
      const bounds      = this.scrollArea.getBoundingClientRect();
      const pixelLeft   = Math.round(e.pageX - bounds.left);
      const time        = Math.round((pixelLeft + this.widget.viewport.pseudoScrollLeft) * this.widget.viewport.pixelTime);
      const zoomOffset  = Math.min(touchpadScrollDivisor, Math.max(-touchpadScrollDivisor, deltaY));

      //if (deltaY !== zoomOffset) {console.log('deltaY: ' + deltaY + '; zoomOffset: ' + zoomOffset);}
      // scroll up zooms in (- deltaY), scroll down zooms out (+ deltaY)
      if      (mouseMode && (deltaY > 0)) {this.widget.events.dispatch(ActionType.Zoom, 1, time, pixelLeft);}
      else if (mouseMode && (deltaY < 0)) {this.widget.events.dispatch(ActionType.Zoom,-1, time, pixelLeft);}

      // Handle zooming with touchpad since we apply scroll attenuation
      else {
        this.widget.events.dispatch(ActionType.Zoom, zoomOffset / touchpadScrollDivisor, time, pixelLeft);
      }

    } else {
      //if (isTouchpad) {
      //  this.viewport.handleScrollEvent(this.viewport.pseudoScrollLeft + e.deltaX);
      //  this.scrollArea.scrollTop       += e.deltaY;
      //  this.labelsScroll.scrollTop      = this.scrollArea.scrollTop;
      //  this.transitionScroll.scrollTop  = this.scrollArea.scrollTop;
      //} else {
      //  this.viewport.handleScrollEvent(this.viewport.pseudoScrollLeft + deltaY);
      //}

      const isTouchpad = this.widget.viewerState.autoTouchpadScrolling ? this.isTouchpad(e) : this.widget.viewerState.touchpadScrolling;
      this.touchpadCheckTimer = performance.now() + 100;

      if (e.deltaX !== 0 || isTouchpad) {
        this.widget.viewport.handleScrollEvent(this.widget.viewport.pseudoScrollLeft + deltaX);
        this.scrollArea.scrollTop       += e.deltaY;
        this.labelsScroll.scrollTop      = this.scrollArea.scrollTop;
        this.transitionScroll.scrollTop  = this.scrollArea.scrollTop;
      } else {
        this.widget.viewport.handleScrollEvent(this.widget.viewport.pseudoScrollLeft + deltaY);
      }
    }
  }

  keyDownHandler(e: any) {

    if (this.widget.controlBar.searchInFocus) {return;} 
    else {e.preventDefault();}

    // debug handler to print the data cache
    if (e.key === 'd' && e.ctrlKey) {
      console.log(this.widget.viewport.updatePending);
      console.log(this.widget.viewerState);
      console.log(this.widget.dataManager.netlistData);
    }

    // left and right arrow keys move the marker
    // ctrl + left and right arrow keys move the marker to the next transition

    if ((e.key === 'ArrowRight') && (this.widget.viewerState.markerTime !== null)) {
      if (e.ctrlKey || e.altKey) {this.widget.controlBar.goToNextTransition(1);}
      else if (e.metaKey) {this.widget.events.dispatch(ActionType.MarkerSet, this.widget.viewport.timeStop, 0);}
      else                {this.widget.events.dispatch(ActionType.MarkerSet, this.widget.viewerState.markerTime + 1, 0);}
    } else if ((e.key === 'ArrowLeft') && (this.widget.viewerState.markerTime !== null)) {
      if (e.ctrlKey || e.altKey) {this.widget.controlBar.goToNextTransition(-1);}
      else if (e.metaKey) {this.widget.events.dispatch(ActionType.MarkerSet, 0, 0);}
      else                {this.widget.events.dispatch(ActionType.MarkerSet, this.widget.viewerState.markerTime - 1, 0);}

    // up and down arrow keys move the selected signal
    // alt + up and down arrow keys reorder the selected signal up and down
    } else if ((e.key === 'ArrowUp') && (this.widget.viewerState.selectedSignalIndex !== null)) {
      const newIndex = Math.max(this.widget.viewerState.selectedSignalIndex - 1, 0);
      if (e.altKey) {this.widget.events.dispatch(ActionType.ReorderSignals, this.widget.viewerState.selectedSignalIndex, newIndex);}
      else          {this.widget.events.dispatch(ActionType.SignalSelect, this.widget.viewerState.displayedSignals[newIndex]);}
    } else if ((e.key === 'ArrowDown') && (this.widget.viewerState.selectedSignalIndex !== null)) {
      const newIndex = Math.min(this.widget.viewerState.selectedSignalIndex + 1, this.widget.viewerState.displayedSignals.length - 1);
      if (e.altKey) {this.widget.events.dispatch(ActionType.ReorderSignals, this.widget.viewerState.selectedSignalIndex, newIndex);}
      else          {this.widget.events.dispatch(ActionType.SignalSelect, this.widget.viewerState.displayedSignals[newIndex]);}
    }

    // handle Home and End keys to move to the start and end of the waveform
    else if (e.key === 'Home') {this.widget.events.dispatch(ActionType.MarkerSet, 0, 0);}
    else if (e.key === 'End')  {this.widget.events.dispatch(ActionType.MarkerSet, this.widget.viewport.timeStop, 0);}

    // "N" and Shoft + "N" go to the next transition
    else if (e.key === 'n') {this.widget.controlBar.goToNextTransition(1);}
    else if (e.key === 'N') {this.widget.controlBar.goToNextTransition(-1);}

    else if (e.key === 'Escape') {this.widget.events.dispatch(ActionType.SignalSelect, null);}
    else if (e.key === 'Delete') {this.removeVariableInternal(this.widget.viewerState.selectedSignal);}

  }

  handleMouseUp(event: MouseEvent) {
    //console.log('mouseup event type: ' + mouseupEventType);
    if (this.widget.viewerState.mouseupEventType === 'rearrange') {
      this.widget.labelsPanel.dragEnd(event);
    } else if (this.widget.viewerState.mouseupEventType === 'resize') {
      this.widget.labelsPanel.resizeElement.classList.remove('is-resizing');
      this.widget.labelsPanel.resizeElement.classList.add('is-idle');
      document.removeEventListener("mousemove", this.widget.labelsPanel.resize, false);
      this.handleResizeViewer();
    } else if (this.widget.viewerState.mouseupEventType === 'scroll') {
      this.scrollbar.classList.remove('is-dragging');
      document.removeEventListener('mousemove', this.widget.viewport.handleScrollbarMove, false);
      this.widget.viewport.scrollbarMoved = false;
    } else if (this.widget.viewerState.mouseupEventType === 'highlightZoom') {
      this.scrollArea.removeEventListener('mousemove', this.widget.viewport.drawHighlightZoom, false);
      this.widget.viewport.highlightListenerSet = false;
      this.widget.viewport.highlightZoom();
    } else if (this.widget.viewerState.mouseupEventType === 'markerSet') {
      this.scrollArea.removeEventListener('mousemove', this.widget.viewport.drawHighlightZoom, false);
      clearTimeout(this.widget.viewport.highlightDebounce);
      this.widget.viewport.handleScrollAreaClick(this.widget.viewport.highlightStartEvent, 0);
      this.widget.viewport.highlightListenerSet = false;
      if (this.widget.viewport.highlightElement) {
        this.widget.viewport.highlightElement.remove();
        this.widget.viewport.highlightElement = null;
      }
    }
    this.widget.viewerState.mouseupEventType = null;
  }

  // #region Global Events
  reorderSignals(oldIndex: number, newIndex: number) {
    //arrayMove(viewerState.displayedSignals, oldIndex, newIndex);
    this.widget.events.dispatch(ActionType.SignalSelect, this.widget.viewerState.displayedSignals[newIndex]);
  }

  handleResizeViewer() {
    clearTimeout(this.resizeDebounce);
    this.resizeDebounce = setTimeout(this.widget.events.dispatch.bind(this.widget.events, ActionType.Resize), 100);
  }

  handleMarkerSet(time: number, markerType: number) {
    if (time > this.widget.viewport.timeStop || time < 0) {return;}
    //sendWebviewContext();
  }

  handleSignalSelect(netlistId: NetlistId | null) {
    if (netlistId === null) {return;}
    //sendWebviewContext();
  }

// #region Helper Functions

  syncVerticalScroll(e: any, scrollLevel: number) {
    const deltaY = e.deltaY;
    if (this.widget.viewport.updatePending) {return;}
    this.widget.viewport.updatePending     = true;
    this.labelsScroll.scrollTop     = scrollLevel + deltaY;
    this.transitionScroll.scrollTop = scrollLevel + deltaY;
    this.scrollArea.scrollTop       = scrollLevel + deltaY;
    this.widget.viewport.renderAllWaveforms(false);
    this.widget.viewport.updatePending     = false;
  }

  handleViewportScroll() {
    if (this.widget.viewport.updatePending) {return;}
    this.widget.viewport.updatePending     = true;
    this.labelsScroll.scrollTop     = this.scrollArea.scrollTop;
    this.transitionScroll.scrollTop = this.scrollArea.scrollTop;
    this.widget.viewport.renderAllWaveforms(false);
    this.widget.viewport.updatePending     = false;
  }

  unload() {
    this.widget.viewerState.selectedSignal      = null;
    this.widget.viewerState.selectedSignalIndex = null;
    this.widget.viewerState.markerTime          = null;
    this.widget. viewerState.altMarkerTime       = null;
    this.widget.viewerState.displayedSignals    = [];
    this.widget.dataManager.unload();

    //this.contentArea.style.height = '40px';
    //this.viewport.updateContentArea(0, [0, 0]);
    this.widget.events.dispatch(ActionType.Zoom, 1, 0, 0);
    this.widget.labelsPanel.renderLabelsPanels();
    this.widget.viewport.init({defaultZoom: 1, timeScale: 1, timeEnd: 0});
    //vscode.postMessage({type: 'ready'});
  }

  // We need to let the extension know that we are removing a variable so that
  // it can update the views. Rather than handling it and telling the extension,
  // we just have the extension handle it as normal.
  removeVariableInternal(netlistId: NetlistId | null) {
    if (netlistId === null) {return;}
    /*vscode.postMessage({
      command: 'removeVariable',
      netlistId: netlistId
    });*/
  }

  removeVariable(netlistId: NetlistId | null) {
    if (netlistId === null) {return;}
    const index = this.widget.viewerState.displayedSignals.findIndex((id: NetlistId) => id === netlistId);
    //console.log('deleting signal' + message.signalId + 'at index' + index);
    if (index === -1) {
      return;
    } else {
      const newindex = Math.min(this.widget.viewerState.displayedSignals.length - 2, index);
      this.widget.events.dispatch(ActionType.RemoveVariable, netlistId);
      if (this.widget.viewerState.selectedSignal === netlistId) {
        const newNetlistId = this.widget.viewerState.displayedSignals[newindex];
        this.widget.events.dispatch(ActionType.SignalSelect, newNetlistId);
      }
    }
  }

  handleSetSelectedSignal(netlistId: NetlistId) {
    if (netlistId === null) {return;}
    if (this.widget.dataManager.netlistData[netlistId] === undefined) {return;}
    this.widget.events.dispatch(ActionType.SignalSelect, netlistId);
  }

  handleMessage(e: any) {
   // const message = e.data;
/*
    switch (message.command) {
      case 'create-ruler':          {this.viewport.init(message.waveformDataSet); break;}
      case 'unload':                {this.unload(); break;}
      case 'add-variable':          {dataManager.addVariable(message.signalList); break;}
      case 'update-waveform-chunk': {dataManager.updateWaveformChunk(message); break;}
      //case 'update-waveform-full':  {dataManager.updateWaveformFull(message); break;}
      case 'remove-signal':         {this.removeVariable(message.netlistId); break;}
      case 'setDisplayFormat':      {dataManager.setDisplayFormat(message); break;}
      case 'setWaveDromClock':      {dataManager.waveDromClock = {netlistId: message.netlistId, edge:  message.edge,}; break;}
      case 'getSelectionContext':   {sendWebviewContext(); break;}
      case 'setMarker':             {this.events.dispatch(ActionType.MarkerSet, message.time, message.markerType); break;}
      case 'setSelectedSignal':     {this.handleSetSelectedSignal(message.netlistId); break;}
      case 'getContext':            {sendWebviewContext(); break;}
      case 'copyWaveDrom':          {dataManager.copyWaveDrom(); break;}
      case 'copyValueAtMarker':     {labelsPanel.copyValueAtMarker(message.netlistId); break;}
      case 'updateColorTheme':      {this.events.dispatch(ActionType.updateColorTheme); break;}
    }*/
  }
}