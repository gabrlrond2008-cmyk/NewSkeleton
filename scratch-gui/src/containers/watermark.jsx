import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

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

const mapStateToProps = state => ({
    selectedDevice: state.scratchGui.device.selectedDevice
});

export default connect(mapStateToProps)(Watermark);
