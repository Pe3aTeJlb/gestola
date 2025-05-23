import { WaveformWidget } from '../waveform-widget';
import { EventHandler, arrayMove, NetlistId, ActionType} from './helper';

export class LabelsPanels {

  resizeElement: any = null;
  widget: WaveformWidget;
  events: EventHandler;

  webview: HTMLElement;
  labels: HTMLElement;
  transitionDisplay: HTMLElement;
  labelsScroll: HTMLElement;
  transitionScroll: HTMLElement;
  resize1: HTMLElement;
  resize2: HTMLElement;

  // drag handler variables
  labelsList: any            = [];
  idleItems: any             = [];
  draggableItem: any         = null;
  draggableItemIndex: any    = null;
  draggableItemNewIndex: any = null;
  pointerStartX: any         = null;
  pointerStartY: any         = null;
  resizeIndex: any           = null;
  valueAtMarker: any         = {};

  constructor(widget: WaveformWidget) {
    this.widget = widget;
    this.events = this.widget.events;

    const webview           = document.getElementById('vaporview-top'+'-'+this.widget.widgetId);
    const labels            = document.getElementById('waveform-labels'+'-'+this.widget.widgetId);
    const transitionDisplay = document.getElementById('transition-display'+'-'+this.widget.widgetId);
    const labelsScroll      = document.getElementById('waveform-labels-container'+'-'+this.widget.widgetId);
    const transitionScroll  = document.getElementById('transition-display-container'+'-'+this.widget.widgetId);
    const resize1           = document.getElementById("resize-1"+'-'+this.widget.widgetId);
    const resize2           = document.getElementById("resize-2"+'-'+this.widget.widgetId);

    if (webview === null || labels === null || transitionDisplay === null || labelsScroll === null || transitionScroll === null || resize1 === null || resize2 === null) {
      throw new Error("Could not find all required elements");
    }

    this.webview           = webview;
    this.labels            = labels;
    this.transitionDisplay = transitionDisplay;
    this.labelsScroll      = labelsScroll;
    this.transitionScroll  = transitionScroll;
    this.resize1           = resize1;
    this.resize2           = resize2;

    this.dragMove              = this.dragMove.bind(this);
    this.resize                = this.resize.bind(this);
    this.dragEnd               = this.dragEnd.bind(this);
    this.dragStart             = this.dragStart.bind(this);
    this.handleResizeMousedown = this.handleResizeMousedown.bind(this);
    this.handleMarkerSet       = this.handleMarkerSet.bind(this);
    this.handleSignalSelect    = this.handleSignalSelect.bind(this);
    this.handleReorderSignals  = this.handleReorderSignals.bind(this);
    this.handleRemoveVariable  = this.handleRemoveVariable.bind(this);
    this.handleAddVariable     = this.handleAddVariable.bind(this);
    this.handleRedrawVariable  = this.handleRedrawVariable.bind(this);
    this.handleUpdateColor     = this.handleUpdateColor.bind(this);
  
    // click and drag handlers to rearrange the order of waveform signals
    labels.addEventListener('mousedown', (e) => {this.dragStart(e);});
    // Event handlers to handle clicking on a waveform label to select a signal
    labels.addEventListener(           'click', (e) => this.clicklabel(e, labels));
    labels.addEventListener('contextmenu', (e) => {this.handleContextMenu(e, labels)});
    transitionDisplay.addEventListener('click', (e) => this.clicklabel(e, transitionDisplay));
    transitionDisplay.addEventListener('contextmenu', (e) => {this.handleContextMenu(e, transitionDisplay)});
    // resize handler to handle column resizing
    resize1.addEventListener("mousedown",   (e) => {this.handleResizeMousedown(e, resize1, 1);});
    resize2.addEventListener("mousedown",   (e) => {this.handleResizeMousedown(e, resize2, 2);});

    this.events.subscribe(ActionType.MarkerSet, this.handleMarkerSet);
    this.events.subscribe(ActionType.SignalSelect, this.handleSignalSelect);
    this.events.subscribe(ActionType.ReorderSignals, this.handleReorderSignals);
    this.events.subscribe(ActionType.AddVariable, this.handleAddVariable);
    this.events.subscribe(ActionType.RemoveVariable, this.handleRemoveVariable);
    this.events.subscribe(ActionType.RedrawVariable, this.handleRedrawVariable);
    this.events.subscribe(ActionType.updateColorTheme, this.handleUpdateColor);
  }

  handleContextMenu(event: MouseEvent, containerElement: HTMLElement){
    this.clicklabel(event, containerElement);
    this.widget.handleContextMenu(event);
  }

  renderLabelsPanels() {
    this.labelsList  = [];
    const transitions: string[] = [];
    this.widget.viewerState.displayedSignals.forEach((netlistId, index) => {
      const isSelected  = (netlistId === this.widget.viewerState.selectedSignal);
      this.labelsList.push(this.createLabel(netlistId, isSelected));
      transitions.push(this.createValueDisplayElement(netlistId, this.valueAtMarker[netlistId], isSelected));
    });
    this.labels.innerHTML            = this.labelsList.join('');
    this.transitionDisplay.innerHTML = transitions.join('');
  }


  createLabel(netlistId: NetlistId, isSelected: boolean) {
    //let selectorClass = 'is-idle';
    //if (isSelected) {selectorClass = 'is-selected';}
    const netlistData   = this.widget.dataManager.netlistData[netlistId];
    const vscodeContext = netlistData.vscodeContext;
    const selectorClass = isSelected ? 'is-selected' : '';
    const signalName    = this.htmlSafe(netlistData.signalName);
    const modulePath    = this.htmlSafe(netlistData.modulePath + '.');
    const fullPath      = this.htmlAttributeSafe(modulePath + signalName);
    const type          = netlistData.variableType;
    const width         = netlistData.signalWidth;
    const encoding      = netlistData.encoding;
    const tooltip       = "Name: " + fullPath + "\nType: " + type + "\nWidth: " + width + "\nEncoding: " + encoding; 
    return `<div class="waveform-label is-idle ${selectorClass}" id="label-${netlistId}" title="${tooltip}" data-vscode-context=${vscodeContext}>
              <div class='codicon codicon-grabber'></div>
              <p style="opacity:50%">${modulePath}</p><p>${signalName}</p>
            </div>`;
  }

  createValueDisplayElement(netlistId: NetlistId, value: any, isSelected: boolean) {

    if (value === undefined) {value = [];}

    const data          = this.widget.dataManager.netlistData[netlistId];
    const vscodeContext = data.vscodeContext;
    const selectorClass = isSelected ? 'is-selected' : 'is-idle';
    const joinString    = '<p style="color:var(--theia-foreground)">-></p>';
    const width         = data.signalWidth;
    const parseValue    = data.valueFormat.formatString;
    const valueIs9State = data.valueFormat.is9State;
    const pElement      = value.map((v: string) => {
      const is9State     = valueIs9State(v);
      const colorStyle   = is9State ? 'var(--theia-debugTokenExpression-error)' : data.color;
      const displayValue = parseValue(v, width, !is9State);
      return `<p style="color:${colorStyle}">${displayValue}</p>`;
    }).join(joinString);

    return `<div class="waveform-label ${selectorClass}" id="value-${netlistId}" data-vscode-context=${vscodeContext}>${pElement}</div>`;
  }

  htmlSafe(string: string) {
    return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  htmlAttributeSafe(string: string) {
    return string.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  clicklabel (event: any, containerElement: HTMLElement) {
    const labelsList   = Array.from(containerElement.querySelectorAll('.waveform-label'));
    const clickedLabel = event.target.closest('.waveform-label');
    const itemIndex    = labelsList.indexOf(clickedLabel);
    //this.handleSignalSelect(viewerState.displayedSignals[itemIndex]);
    this.events.dispatch(ActionType.SignalSelect, this.widget.viewerState.displayedSignals[itemIndex]);
  }

  copyValueAtMarker(netlistId: NetlistId | undefined): string {

    if (netlistId === undefined) {return "";}
    const value = this.valueAtMarker[netlistId];
    if (value === undefined) {return "";}

    const formatString   = this.widget.dataManager.netlistData[netlistId].valueFormat.formatString;
    const width          = this.widget.dataManager.netlistData[netlistId].signalWidth;
    const bitVector      = value[value.length - 1];
    const formattedValue = formatString(bitVector, width, true);

    return formattedValue;
  }

  updateIdleItemsStateAndPosition() {
    const draggableItemRect = this.draggableItem.getBoundingClientRect();
    const draggableItemY    = draggableItemRect.top + draggableItemRect.height / 2;

    let closestItemAbove: any = null;
    let closestItemBelow: any = null;
    let closestDistanceAbove  = Infinity;
    let closestDistanceBelow  = Infinity;

    this.idleItems.forEach((item: any) => {
      item.style.border = 'none';
      const itemRect = item.getBoundingClientRect();
      const itemY = itemRect.top + itemRect.height / 2;
      if (draggableItemY >= itemY) {
        const distance = draggableItemY - itemY;
        if (distance < closestDistanceAbove) {
          closestDistanceAbove = distance;
          closestItemAbove     = item;
        }
      } else if (draggableItemY < itemY) {
        const distance = itemY - draggableItemY;
        if (distance < closestDistanceBelow) {
          closestDistanceBelow = distance;
          closestItemBelow     = item;
        }
      }
    });

    const closestItemAboveIndex = Math.max(this.labelsList.indexOf(closestItemAbove), 0);
    let closestItemBelowIndex = this.labelsList.indexOf(closestItemBelow);
    if (closestItemBelowIndex === -1) {closestItemBelowIndex = this.labelsList.length - 1;}

    if (closestItemBelow !== null) {
      closestItemBelow.style.borderTop    = '2px dotted var(--theia-editorCursor-foreground)';
      closestItemBelow.style.borderBottom = '2px dotted transparent';
    } else if (closestItemAbove !== null) {
      closestItemAbove.style.borderTop    = '2px dotted transparent';
      closestItemAbove.style.borderBottom = '2px dotted var(--theia-editorCursor-foreground)';
    }

    if (this.draggableItemIndex < closestItemAboveIndex) {
      this.draggableItemNewIndex = closestItemAboveIndex;
    } else if (this.draggableItemIndex > closestItemBelowIndex) {
      this.draggableItemNewIndex = closestItemBelowIndex;
    } else {
      this.draggableItemNewIndex = this.draggableItemIndex;
    }
  }

  dragStart(event: any) {
    event.preventDefault();
    this.labelsList    = Array.from(this.labels.querySelectorAll('.waveform-label'));

    if (event.target.classList.contains('codicon-grabber')) {
      this.draggableItem = event.target.closest('.waveform-label');
    }

    if (!this.draggableItem) {return;}

    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;

    this.draggableItem.classList.remove('is-idle');
    this.draggableItem.classList.remove('is-selected');
    this.draggableItem.classList.add('is-draggable');

    document.addEventListener('mousemove', this.dragMove);

    this.widget.viewerState.mouseupEventType = 'rearrange';
    this.draggableItemIndex    = this.labelsList.indexOf(this.draggableItem);
    this.draggableItemNewIndex = this.draggableItemIndex;
    this.idleItems             = this.labelsList.filter((item: any) => {return item.classList.contains('is-idle');});
  }

  dragMove(event: MouseEvent) {
    if (!this.draggableItem) {return;}

    const pointerOffsetX = event.clientX - this.pointerStartX;
    const pointerOffsetY = event.clientY - this.pointerStartY;

    this.draggableItem.style.transform = `translate(${pointerOffsetX}px, ${pointerOffsetY}px)`;

    this.updateIdleItemsStateAndPosition();
  }

  dragEnd(event: MouseEvent) {
    event.preventDefault();
    if (!this.draggableItem) {return;}

    this.idleItems.forEach((item: any) => {item.style = null;});
    document.removeEventListener('mousemove', this.dragMove);

    this.events.dispatch(ActionType.ReorderSignals, this.draggableItemIndex, this.draggableItemNewIndex);

    this.labelsList            = [];
    this.idleItems             = [];
    this.draggableItemIndex    = null;
    this.draggableItemNewIndex = null;
    this.pointerStartX         = null;
    this.pointerStartY         = null;
    this.draggableItem         = null;
  }

  handleResizeMousedown(event: MouseEvent, element: HTMLElement, index: number) {
    this.resizeIndex   = index;
    this.resizeElement = element;
    event.preventDefault();
    this.resizeElement.classList.remove('is-idle');
    this.resizeElement.classList.add('is-resizing');
    document.addEventListener("mousemove", this.resize, false);
    this.widget.viewerState.mouseupEventType = 'resize';
  }

  // resize handler to handle resizing
  resize(e: MouseEvent) {
    const gridTemplateColumns = this.webview.style.gridTemplateColumns;
    const column1 = parseInt(gridTemplateColumns.split(' ')[0]);
    const column2 = parseInt(gridTemplateColumns.split(' ')[1]);

    if (this.resizeIndex === 1) {
      this.webview.style.gridTemplateColumns = `${e.x-this.webview.getBoundingClientRect().left}px ${column2}px auto`;
      this.resize1.style.left = `${e.x-this.webview.getBoundingClientRect().left}px`;
      this.resize2.style.left = `${e.x -this.webview.getBoundingClientRect().left+ column2}px`;
    } else if (this.resizeIndex === 2) {
      const newWidth    = Math.max(10, e.x - this.webview.getBoundingClientRect().left - column1);
      const newPosition = Math.max(10 + column1, e.x - this.webview.getBoundingClientRect().left);
      this.webview.style.gridTemplateColumns = `${column1}px ${newWidth}px auto`;
      this.resize2.style.left = `${newPosition}px`;
    }
  }

  handleAddVariable(netlistIdList: NetlistId[], updateFlag: boolean) {
    this.renderLabelsPanels();
  }

  handleRemoveVariable(netlistId: NetlistId) {
    const index = this.widget.viewerState.displayedSignals.findIndex((id: NetlistId) => id === netlistId);
    this.widget.viewerState.displayedSignals.splice(index, 1);
    this.renderLabelsPanels();
  }

  handleReorderSignals(oldIndex: number, newIndex: number) {

    if (this.draggableItem) {
      this.draggableItem.style   = null;
      this.draggableItem.classList.remove('is-draggable');
      this.draggableItem.classList.add('is-idle');
    } else {
      this.labelsList = Array.from(this.labels.querySelectorAll('.waveform-label'));
    }

    arrayMove(this.labelsList, oldIndex, newIndex);
    arrayMove(this.widget.viewerState.displayedSignals, oldIndex, newIndex);
    this.renderLabelsPanels();
  }

  handleMarkerSet(time: number, markerType: number) {

    if (time > this.widget.viewport.timeStop || time < 0) {return;}

    if (markerType === 0) {
      this.widget.viewerState.displayedSignals.forEach((netlistId) => {
        this.valueAtMarker[netlistId] = this.widget.dataManager.getValueAtTime(netlistId, time);
      });

      this.renderLabelsPanels();
    }
  }

  handleSignalSelect(netlistId: NetlistId | null) {

    if (netlistId === null) {return;}

    this.widget.viewerState.selectedSignal      = netlistId;
    this.widget.viewerState.selectedSignalIndex = this.widget.viewerState.displayedSignals.findIndex((signal) => {return signal === netlistId;});
    if (this.widget.viewerState.selectedSignalIndex === -1) {this.widget.viewerState.selectedSignalIndex = null;}
  
    //setSeletedSignalOnStatusBar(netlistId);
    this.renderLabelsPanels();
  }

  handleRedrawVariable(netlistId: NetlistId) {
    this.renderLabelsPanels();
  }

  handleUpdateColor() {
    this.renderLabelsPanels();
  }
}