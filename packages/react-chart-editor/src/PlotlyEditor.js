import React, {Component} from 'react';
import createPlotComponent from 'react-plotly.js/factory';
import EditorControls from './EditorControls';
import PropTypes from 'prop-types';
import {DEFAULT_FONTS} from 'react-chart-editor/lib/lib/constants';
import RGL, { WidthProvider } from "react-grid-layout";
import _ from "lodash";
import '../style/style.css';
import '../style/style2.css';
import { ICONS } from './constants';

const ReactGridLayout = WidthProvider(RGL);

class PlotlyEditor extends Component {

  constructor(props) {
    super();
    
    this.state = {
      gridItems: [0].map(function(i, key, list) {
        return {
          i: i.toString(),
          x: i * 2,
          y: 0,
          w: 4,
          h: 2,
        };
      }),
      newCounter: 1,
      cols: 12,
      graphDiv: undefined,
      selectedGraphDiv: undefined,
      data: props.data,
      layout: props.layout,
      frames: props.frames,
    };

    this.PlotComponent = createPlotComponent(props.plotly);
    this.onUpdate = this.onUpdate.bind(this);
    this.createElement = this.createElement.bind(this);
    this.onCollectWidgets = this.onCollectWidgets.bind(this);
    
    this.handleDivSelect = this.handleDivSelect.bind(this);
    this.handleRender = this.handleRender.bind(this);
    
    this.onLayoutChange = this.onLayoutChange.bind(this);

    this.onAddWidget = this.onAddWidget.bind(this);
    this.onRemoveWidget = this.onRemoveWidget.bind(this);

    this.handleWidgetResize = this.handleWidgetResize.bind(this);
  }

  handleDivSelect(event) {
    const selectedGraphDiv = event.currentTarget.children[0];
    this.setState({selectedGraphDiv});
  }

  handleRender(fig, graphDiv) {
    if(this.state.selectedGraphDiv == undefined){
      this.setState({selectedGraphDiv: graphDiv});
    }
    this.setState({graphDiv});

    if (this.props.onRender) {
      this.props.onRender(graphDiv.data, graphDiv.layout, graphDiv._transitionData._frames);
    }
  }

  onUpdate(id, data, layout, frames){
    const newData = this.state.data;
    newData[Number(id)] = data;
    const newLayout = this.state.layout;
    newLayout[Number(id)] = layout;
    const newFrames = this.state.frames;
    newFrames[Number(id)] = frames
    this.setState({data: newData, layout: newLayout, frames: newFrames});
  }

  handleWidgetResize(layout, oldItem, newItem, placeholder, e, element) {
    const selectedGraphDiv = this.state.selectedGraphDiv;
    this.props.plotly.react(selectedGraphDiv, selectedGraphDiv.data, selectedGraphDiv.layout, selectedGraphDiv.config);
  }

  onLayoutChange(gridItems) {
    this.setState({ gridItems });
    if(this.props.onLayoutChange){
      this.props.onLayoutChange(gridItems);
    }
  }

  onAddWidget() {
    const newData = this.state.data;
    newData[Number(this.state.newCounter)] = [];
    const newLayout = this.state.layout;
    newLayout[Number(this.state.newCounter)] = {};
    const newFrames = this.state.frames;
    newFrames[Number(this.state.newCounter)] = []
    this.setState({
      // Add a new item. It must have a unique key!
      gridItems: this.state.gridItems.concat({
        i: this.state.newCounter.toString(),
        x: 0,
        y: Infinity, // puts it at the bottom
        w: 4,
        h: 2,
      }),
      newCounter: this.state.newCounter + 1,
      data: newData, 
      layout: newLayout, 
      frames: newFrames
    });
  }


  onRemoveWidget(graphDiv) {
    this.setState({ 
      gridItems: _.reject(this.state.gridItems, { i: graphDiv.id }),
      graphDiv: graphDiv,
      selectedGraphDiv: undefined
    });
  }

  onCollectWidgets(){
    return this.state.gridItems.map(el => {
      return {
        i: el.i,
        x: el.x,
        y: el.y,
        w: el.w,
        h: el.h,
        template: this.props.plotly.makeTemplate({data: this.state.data[Number(el.i)], layout:this.state.data[Number(el.i)]}),
        dataSource: this.props.dataSourceName,
        sqlColumns: this.collectDistinctColumns(this.state.data[Number(el.i)])
      }
    });
  }

  collectDistinctColumns(data){
    const columns = [];
    if(data.length > 0){
      for(let d of data){
        columns.push(...Object.values(d.meta.columnNames));
      }
    }
    return [...new Set(columns)]

  }

  createElement(el) {
    const dragStyle = {
      position: "absolute",
      left: "50%",
      top: 0,
      cursor: "pointer"
    };
    const i = el.add ? "+" : el.i;
    const nconf = this.props.config;
    nconf.modeBarButtonsToAdd = [
      {
        name: 'Delete',
        icon: ICONS.CLOSE,
        direction: 'up',
        click: this.onRemoveWidget
      }
    ];
    
    return (
      <div key={i} data-grid={el} onMouseDownCapture={this.handleDivSelect} 
      style={
        (this.state.selectedGraphDiv && this.state.selectedGraphDiv.id == el.i ? {outline: "5px solid aqua"} : {})
      }
      >
      <this.PlotComponent
        data={this.state.data[Number(el.i)]}
        layout={this.state.layout[Number(el.i)]}
        frames={this.state.frames[Number(el.i)]}
        config={nconf}
        useResizeHandler={this.props.useResizeHandler}
        debug={this.props.debug}
        onInitialized={this.handleRender}
        onUpdate={this.handleRender}
        style={{width: '100%', height: '100%'}}
        divId={el.i}
      />
      <span
        className="drag-handle"
        style={dragStyle}
        onMouseDown={(e) => e.preventDefault()}
      >
      ...
      </span>
      </div>
    );
  }

  render() {
    return (
      <div className="plotly_editor">
        {!this.props.hideControls && (
          <EditorControls
            gridItemsCount={this.state.gridItems.length}
            graphDiv={this.state.graphDiv}
            selectedGraphDiv={this.state.selectedGraphDiv}
            dataSources={this.props.dataSources}
            dataSourceOptions={this.props.dataSourceOptions}
            plotly={this.props.plotly}
            onUpdate={this.onUpdate}
            onAddWidget={this.onAddWidget}
            onRemoveWidget={this.onRemoveWidget}
            advancedTraceTypeSelector={this.props.advancedTraceTypeSelector}
            locale={this.props.locale}
            traceTypesConfig={this.props.traceTypesConfig}
            dictionaries={this.props.dictionaries}
            showFieldTooltips={this.props.showFieldTooltips}
            srcConverters={this.props.srcConverters}
            makeDefaultTrace={this.props.makeDefaultTrace}
            glByDefault={this.props.glByDefault}
            mapBoxAccess={Boolean(this.props.config && this.props.config.mapboxAccessToken)}
            fontOptions={this.props.fontOptions}
            chartHelp={this.props.chartHelp}
            customConfig={this.props.customConfig}
            onCollectWidgets={this.onCollectWidgets}
            onSaveDashboard={this.props.onSaveDashboard}
            onPreviewDashboard={this.props.onPreviewDashboard}
          >
            {this.props.children}
          </EditorControls>
        )}
         <div className="plotly_editor_plot" style={{width: '100%', height: '100%'}}>
          <ReactGridLayout
            cols={12}
            draggableHandle=".drag-handle"
            resizeHandles={["s", "w", "e", "sw", "nw", "se"]}
            isBounded={true}
            autoSize={true}
            onLayoutChange={this.onLayoutChange}
            onResize={this.handleWidgetResize}
            onResizeStop={this.handleWidgetResize}
            style={{width: '100%', height: '100%'}}
            {...this.props}
            >
          
            {this.state.gridItems.map(this.createElement)}
            </ReactGridLayout>
        </div>
      </div>
    );
  }
}

PlotlyEditor.propTypes = {
  dataSourceName: PropTypes.string,
  children: PropTypes.any,
  layout: PropTypes.array,
  data: PropTypes.array,
  config: PropTypes.object,
  dataSourceOptions: PropTypes.array,
  dataSources: PropTypes.object,
  frames: PropTypes.array,
  onUpdate: PropTypes.func,
  onRender: PropTypes.func,
  onSaveDashboard: PropTypes.func,
  onPreviewDashboard: PropTypes.func,
  plotly: PropTypes.object,
  useResizeHandler: PropTypes.bool,
  debug: PropTypes.bool,
  advancedTraceTypeSelector: PropTypes.bool,
  locale: PropTypes.string,
  traceTypesConfig: PropTypes.object,
  dictionaries: PropTypes.object,
  divId: PropTypes.string,
  hideControls: PropTypes.bool,
  showFieldTooltips: PropTypes.bool,
  srcConverters: PropTypes.shape({
    toSrc: PropTypes.func.isRequired,
    fromSrc: PropTypes.func.isRequired,
  }),
  makeDefaultTrace: PropTypes.func,
  glByDefault: PropTypes.bool,
  fontOptions: PropTypes.array,
  chartHelp: PropTypes.object,
  customConfig: PropTypes.object,
};

PlotlyEditor.defaultProps = {
  hideControls: false,
  showFieldTooltips: false,
  fontOptions: DEFAULT_FONTS,
};

export default PlotlyEditor;
