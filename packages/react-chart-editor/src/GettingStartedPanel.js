import React from 'react';
import PropTypes from 'prop-types';
import {LayoutPanel, PanelMessage} from 'react-chart-editor';

const GettingStartedPanel = (props, {localize: _}) => (
  <LayoutPanel>
     <PanelMessage heading={_('Call out your data.')}>
            <p>
              {_(
                'Click Add to Start'
              )}
            </p>
          </PanelMessage>
  </LayoutPanel>
);

GettingStartedPanel.contextTypes = {
  localize: PropTypes.func,
};

export default GettingStartedPanel;
