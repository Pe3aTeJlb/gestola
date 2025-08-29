import PanelEmpty from 'react-chart-editor/lib/components/containers/PanelEmpty';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import PlotlyPanel from 'react-chart-editor/lib/components/containers/PlotlyPanel';
import {LayoutPanel} from 'react-chart-editor/lib/components/containers//derived';
import { ADDITIONAL_EDITOR_ACTIONS } from './constants';

class TraceRequiredPanel extends Component {
  hasTrace() {
    return this.context.fullData.filter((trace) => trace.visible).length > 0;
  }

  render() {
    const {localize: _} = this.context;
    const {children, ...rest} = this.props;

    if (!this.props.visible) {
      return null;
    }
    
    const addAction = {
      label: _('Control'),
      handler: ({onUpdate}) => {
        if (onUpdate) {
          onUpdate({
            type: ADDITIONAL_EDITOR_ACTIONS.ADD_CONTROL,
          });
        }
      },
    };

    return this.hasTrace() ? (
      (children == undefined || children.length < 10)
      ? <LayoutPanel addAction={addAction} {...rest}>{children}</LayoutPanel>
      : <LayoutPanel {...rest}>{children}</LayoutPanel>
    ) : (
      <PanelEmpty heading={_("Looks like there aren't any traces defined yet.")}>
        <p>
          {_('Go to the ')}
          <a onClick={() => this.context.setPanel('Structure', 'Traces')}>{_('Traces')}</a>
          {_(' panel under Structure to define traces.')}
        </p>
      </PanelEmpty>
    );
  }
}

TraceRequiredPanel.propTypes = {
  children: PropTypes.node,
  visible: PropTypes.bool,
};

TraceRequiredPanel.defaultProps = {
  visible: true,
};

TraceRequiredPanel.contextTypes = {
  fullData: PropTypes.array,
  localize: PropTypes.func,
  setPanel: PropTypes.func,
};

export default TraceRequiredPanel;
