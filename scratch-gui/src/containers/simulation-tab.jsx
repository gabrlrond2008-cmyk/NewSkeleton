import PropTypes from 'prop-types';
import React from 'react';
import VM from 'scratch-vm';
import {STAGE_SIZE_MODES} from '../lib/layout-constants';
import Box from '../components/box/box.jsx';
import StageWrapper from './stage-wrapper.jsx';
import TargetPane from './target-pane.jsx';
import styles from '../components/simulation-tab/simulation-tab.css';

const SimulationTab = function (props) {
    return (
        <Box className={styles.simulationWrapper}>
            <Box className={styles.stageSection}>
                <StageWrapper
                    isFullScreen={props.isFullScreen}
                    isRendererSupported={props.isRendererSupported}
                    isRtl={props.isRtl}
                    loading={props.loading}
                    stageSize={props.stageSize}
                    vm={props.vm}
                    useEditorDragStyle={false}
                    allDraggable={true}
                />
            </Box>
            <Box className={styles.targetPaneSection}>
                <TargetPane vm={props.vm} stageSize={props.stageSize} />
            </Box>
        </Box>
    );
};

SimulationTab.propTypes = {
    isFullScreen: PropTypes.bool,
    isRendererSupported: PropTypes.bool,
    isRtl: PropTypes.bool,
    loading: PropTypes.bool,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    vm: PropTypes.instanceOf(VM).isRequired
};

export default SimulationTab;
