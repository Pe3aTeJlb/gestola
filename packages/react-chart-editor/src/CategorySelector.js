import DropdownWidget from 'react-chart-editor/lib/components/widgets/Dropdown';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import Field from 'react-chart-editor/lib/components/fields/Field';
import nestedProperty from 'plotly.js/src/lib/nested_property';
import {connectToContainer, maybeAdjustSrc, maybeTransposeData} from 'react-chart-editor/lib/lib';
import {TRANSFORMS_LIST} from 'react-chart-editor/lib/lib/constants';
import {getColumnNames} from 'react-chart-editor/lib/lib/dereference';
import { ADDITIONAL_EDITOR_ACTIONS } from './constants';

export function attributeIsData(meta = {}) {
  return meta.valType === 'data_array' || meta.arrayOk;
}

export class UnconnectedCategorySelector extends Component {
  constructor(props, context) {
    super(props, context);

    this.updateCategory = this.updateCategory.bind(this);
    this.setLocals(props, context);
  }

  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    this.setLocals(nextProps, nextContext);
  }

  setLocals(props, context) {
    this.dataSources = context.dataSources || {};
    this.dataSourceOptions = context.dataSourceOptions || [];

    this.srcAttr = props.attr;
    this.srcProperty = nestedProperty(props.container, this.srcAttr).get();
    if(this.srcProperty && this.srcProperty.length > 0){
      this.fullValue = this.context.srcConverters
        ? this.context.srcConverters.toSrc(this.srcProperty, props.container?.type)
        : this.srcProperty[0].label;
    }
    this.hasData = false;
  }

  updateCategory(value) {
    if (!this.props.updateContainer) {
      return;
    }

    const update = {};
    let data;

    const adjustedValue =
      Array.isArray(value) &&
      value.length === 1 &&
      (this.props.attr === 'x' || this.props.attr === 'y')
        ? value[0]
        : value;

    if (Array.isArray(adjustedValue)) {
      data = adjustedValue
        .filter((v) => Array.isArray(this.dataSources[v]))
        .map((v) => this.dataSources[v]);
    } else {
      data = this.dataSources[adjustedValue] || null;
    }

    let srcAttr = maybeAdjustSrc(adjustedValue, this.srcAttr, this.props.container.type, {
      fromSrc: this.context.srcConverters ? this.context.srcConverters.fromSrc : null,
    });

    let distinctData = [...new Set(maybeTransposeData(data, this.srcAttr, this.props.container.type))].sort();

    if (this.context.onUpdate) {
      this.context.onUpdate({
        type: ADDITIONAL_EDITOR_ACTIONS.UPDATE_CONTROL,
        payload: {
          updateMenuIndex: this.props.fullContainer._index,
          distinctData: distinctData,
          data: data,
          srcAttr: srcAttr
        },
      });
      return;
    }

    //this.props.updateContainer(update);
  }

  render() {
    const {localize: _} = this.context;
    const {label} = this.props;
    let newLabel;
    if (typeof label === 'object') {
      const traceType = this.props.container.type;
      if (label[traceType]) {
        newLabel = label[traceType];
      } else {
        newLabel = label['*'];
      }
    } else {
      newLabel = label;
    }

    return (
      <Field {...{...this.props, label: newLabel}}>
        <DropdownWidget
          options={this.dataSourceOptions}
          value={this.fullValue}
          onChange={this.updateCategory}
          multi={false}
          searchable={true}
          clearable={true}
          placeholder={this.hasData ? _('Data inlined in figure') : _('Choose data...')}
          disabled={this.dataSourceOptions.length === 0}
          components={this.props.dataSourceComponents}
        />
      </Field>
    );
  }
}

UnconnectedCategorySelector.propTypes = {
  fullValue: PropTypes.any,
  updateCategory: PropTypes.func,
  container: PropTypes.object,
  ...Field.propTypes,
};

UnconnectedCategorySelector.contextTypes = {
  dataSources: PropTypes.object,
  dataSourceComponents: PropTypes.object,
  dataSourceOptions: PropTypes.array,
  srcConverters: PropTypes.shape({
    toSrc: PropTypes.func.isRequired,
    fromSrc: PropTypes.func.isRequired,
  }),
  container: PropTypes.object,
  onUpdate: PropTypes.func,
  localize: PropTypes.func,
};

UnconnectedCategorySelector.displayName = 'UnconnectedCategorySelector';

export default connectToContainer(UnconnectedCategorySelector, {});
