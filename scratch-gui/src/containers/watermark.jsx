import PropTypes from 'prop-types';
import React from 'react';

import WatermarkComponent from '../components/watermark/watermark.jsx';

const Watermark = props => (
    <WatermarkComponent
        costumeURL={props.selectedDevice ? props.selectedDevice.iconURL : null}
    />
);

Watermark.propTypes = {
    selectedDevice: PropTypes.shape({
        iconURL: PropTypes.string
    })
};

export default Watermark;
