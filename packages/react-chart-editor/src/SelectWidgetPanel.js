import React from 'react';
import PropTypes from 'prop-types';
import {LayoutPanel, PanelMessage} from 'react-chart-editor';

const SelectWidgetPanel = (props, {localize: _}) => (
  <LayoutPanel>
     <PanelMessage heading={_('Nothing Selected!')}>
            <p>
              {_(
                'Click on any widget or press "Add" button'
              )}
            </p>
          </PanelMessage>
  </LayoutPanel>
);

SelectWidgetPanel.contextTypes = {
  localize: PropTypes.func,
};

export default SelectWidgetPanel;
