import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  GraphCreatePanel,
  GraphSubplotsPanel,
  StyleLayoutPanel,
  StyleAxesPanel,
  StyleMapsPanel,
  StyleLegendPanel,
  StyleNotesPanel,
  StyleShapesPanel,
  StyleSlidersPanel,
  StyleImagesPanel,
  StyleTracesPanel,
  StyleColorbarsPanel,
  
} from 'react-chart-editor/lib/default_panels';
import GraphTransformsPanel from './GraphTransformsPanel'
import {traceHasColorbar} from 'react-chart-editor/lib/default_panels/StyleColorbarsPanel';
import Logo from 'react-chart-editor/lib/components/widgets/Logo';
import {TRANSFORMABLE_TRACES, TRACE_TO_AXIS} from 'react-chart-editor/lib/lib/constants';
import {EDITOR_ACTIONS} from 'react-chart-editor/lib/lib/constants';
import {
  Flaglist,
  ColorPicker,
  ColorscalePicker,
  PlotlyFold,
  TextEditor,
  Radio,
  Dropdown,
  Info,
  PlotlySection,
  Numeric,
  LayoutPanel,
  Button,
  SingleSidebarItem,
  TraceAccordion
} from 'react-chart-editor';
import { ADDITIONAL_EDITOR_ACTIONS } from './constants';
import '../style/style2.css';
import GettingStartedPanel from './GettingStartedPanel';
import PanelMenuWrapper from './PanelMenuWrapper';
import SelectWidgetPanel from './SelectWidgetPanel';
import StyleUpdateMenusPanel from './StyleUpdateMenusPanel';

class DefaultEditor extends Component {
  constructor(props, context) {
    super(props, context);
    this.hasTransforms = this.hasTransforms.bind(this);
    this.hasAxes = this.hasAxes.bind(this);
    this.hasMenus = this.hasMenus.bind(this);
    this.hasSliders = this.hasSliders.bind(this);
    this.hasColorbars = this.hasColorbars.bind(this);
    this.hasLegend = this.hasLegend.bind(this);
  }

  hasTransforms() {
    return this.context.fullData.some((d) => TRANSFORMABLE_TRACES.includes(d.type));
  }

  hasAxes() {
    return (
      Object.keys(this.context.fullLayout._subplots).filter(
        (type) =>
          !['cartesian', 'mapbox'].includes(type) &&
          this.context.fullLayout._subplots[type].length > 0
      ).length > 0
    );
  }

  hasMenus() {
    const {
      fullLayout: {updatemenus = []},
    } = this.context;

    return updatemenus.length > 0;
  }

  hasSliders() {
    const {
      layout: {sliders = []},
    } = this.context;

    return sliders.length > 0;
  }

  hasColorbars() {
    return this.context.fullData.some((d) => traceHasColorbar({}, d));
  }

  hasLegend() {
    return this.context.fullData.some((t) => t.showlegend !== undefined); // eslint-disable-line no-undefined
  }

  hasMaps() {
    return this.context.fullData.some((d) =>
      [...TRACE_TO_AXIS.geo, ...TRACE_TO_AXIS.mapbox].includes(d.type)
    );
  }

  render() {
    const _ = this.context.localize;
    const {logoSrc, logoLinkUrl, menuPanelOrder, children} = this.props;
    const logo = logoSrc && <Logo src={logoSrc} link={logoLinkUrl} />;
    const addWidget = {
      label: _('Add'),
      handler: ({onUpdate}) => {
        if (onUpdate) {
          onUpdate({
            type: ADDITIONAL_EDITOR_ACTIONS.ADD_WIDGET,
          });
        }
      },
    };
    const previewDashboard = {
      label: _('Preview'),
      handler: ({onUpdate}) => {
        if (onUpdate) {
          onUpdate({
            type: ADDITIONAL_EDITOR_ACTIONS.PREVIEW_DASHBOARD,
          });
        }
      },
    };
    const saveDashboard = {
      label: _('Save'),
      handler: ({onUpdate}) => {
        if (onUpdate) {
          onUpdate({
            type: ADDITIONAL_EDITOR_ACTIONS.SAVE_DASHBOARD,
          });
        }
      },
    };

    if(this.context.fullData){
      return (
        <PanelMenuWrapper menuPanelOrder={menuPanelOrder}>
          {logo || null}
          <GraphCreatePanel group={_('Structure')} name={_('Traces')} />
          <GraphSubplotsPanel group={_('Structure')} name={_('Subplots')} />
          {this.hasTransforms() && (
            <GraphTransformsPanel group={_('Structure')} name={_('Transforms')} />
          )}
          <StyleLayoutPanel group={_('Style')} name={_('General')} collapsedOnStart />
          <StyleTracesPanel group={_('Style')} name={_('Traces')} />
          {this.hasAxes() && <StyleAxesPanel group={_('Style')} name={_('Axes')} collapsedOnStart />}
          {this.hasMaps() && <StyleMapsPanel group={_('Style')} name={_('Maps')} />}
          {this.hasLegend() && <StyleLegendPanel group={_('Style')} name={_('Legend')} />}
          {this.hasColorbars() && <StyleColorbarsPanel group={_('Style')} name={_('Color Bars')} />}
          <StyleNotesPanel group={_('Annotate')} name={_('Text')} />
          <StyleShapesPanel group={_('Annotate')} name={_('Shapes')} />
          <StyleImagesPanel group={_('Annotate')} name={_('Images')} />
          {this.hasSliders() && <StyleSlidersPanel group={_('Control')} name={_('Sliders')} />}
          {this.hasTransforms() && <StyleUpdateMenusPanel group={_('Control')} name={_('Menus')} />}
          <SingleSidebarItem>
            <Button variant="primary" label={addWidget.label} onClick={() => addWidget.handler(this.context)} />
          </SingleSidebarItem>
          <SingleSidebarItem>
              <Button variant="primary" label={previewDashboard.label} onClick={() => previewDashboard.handler(this.context)} />
          </SingleSidebarItem>
          <SingleSidebarItem>
            <Button variant="primary" label={saveDashboard.label} onClick={() => saveDashboard.handler(this.context)} />
          </SingleSidebarItem>
          {children || null}
        </PanelMenuWrapper>
      );
    } else if (Number(this.context.gridItemsCount) > 0){
          return(<PanelMenuWrapper>
            {logo || null}
            <SelectWidgetPanel group={_('Info')} name={_('Hint')} />
            <SingleSidebarItem>
              <Button variant="primary" label={addWidget.label} onClick={() => addWidget.handler(this.context)} />
            </SingleSidebarItem>
            <SingleSidebarItem>
              <Button variant="primary" label={previewDashboard.label} onClick={() => previewDashboard.handler(this.context)} />
            </SingleSidebarItem>
            <SingleSidebarItem>
              <Button variant="primary" label={saveDashboard.label} onClick={() => saveDashboard.handler(this.context)} />
            </SingleSidebarItem>
          </PanelMenuWrapper>
          )
    } else {
      return(
        <PanelMenuWrapper>
            {logo || null}
            <GettingStartedPanel group={_('Welcome')} name={_('Getting Started')} />
            <SingleSidebarItem>
              <Button variant="primary" label={addWidget.label} onClick={() => addWidget.handler(this.context)} />
            </SingleSidebarItem>
          </PanelMenuWrapper>
      );
    }
  }
}

DefaultEditor.propTypes = {
  children: PropTypes.node,
  logoSrc: PropTypes.string,
  logoLinkUrl: PropTypes.string,
  menuPanelOrder: PropTypes.array,
};

DefaultEditor.contextTypes = {
  gridItemsCount: PropTypes.number,
  localize: PropTypes.func,
  fullData: PropTypes.array,
  fullLayout: PropTypes.object,
  layout: PropTypes.object,
  onUpdate: PropTypes.func,
};

export default DefaultEditor;
