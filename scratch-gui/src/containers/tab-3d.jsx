import PropTypes from 'prop-types';
import React from 'react';
import Tab3DComponent from '../components/tab-3d/tab-3d.jsx';

var Tab3D = function (props) {
    return <Tab3DComponent vm={props.vm} />;
};

Tab3D.propTypes = {
    vm: PropTypes.object.isRequired
};

export default Tab3D;
