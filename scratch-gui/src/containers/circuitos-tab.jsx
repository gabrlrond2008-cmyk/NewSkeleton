import PropTypes from 'prop-types';
import React from 'react';
import CircuitosTabComponent from '../components/circuitos-tab/circuitos-tab.jsx';

var CircuitosTab = function (props) {
    return <CircuitosTabComponent vm={props.vm} />;
};

CircuitosTab.propTypes = {
    vm: PropTypes.object.isRequired
};

export default CircuitosTab;
