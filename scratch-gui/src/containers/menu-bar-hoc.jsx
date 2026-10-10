import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import React from 'react';
import NewProjectModal from '../components/new-project-modal/new-project-modal.jsx';
import {confirmDialog} from '../lib/dialog-helper';

const MenuBarHOC = function (WrappedComponent) {
    class MenuBarContainer extends React.PureComponent {
        constructor (props) {
            super(props);

            bindAll(this, [
                'confirmReadyToReplaceProject',
                'shouldSaveBeforeTransition',
                'handleNewProjectConfirm',
                'handleNewProjectCancel'
            ]);

            this.state = {
                showModal: false,
                modalCallback: null
            };
        }
        confirmReadyToReplaceProject (message, callback) {
            if (this.props.projectChanged.changed && !this.props.canCreateNew) {
                this.setState({showModal: true, modalCallback: callback});
            } else {
                callback(true);
            }
        }
        shouldSaveBeforeTransition () {
            return (this.props.canSave && this.props.projectChanged.changed);
        }
        handleNewProjectConfirm () {
            const cb = this.state.modalCallback;
            this.setState({exiting: true});
            setTimeout(function () {
                this.setState({showModal: false, exiting: false, modalCallback: null});
                if (cb) cb(true);
            }.bind(this), 200);
        }
        handleNewProjectCancel () {
            const cb = this.state.modalCallback;
            this.setState({exiting: true});
            setTimeout(function () {
                this.setState({showModal: false, exiting: false, modalCallback: null});
                if (cb) cb(false);
            }.bind(this), 200);
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                projectChanged,
                /* eslint-enable no-unused-vars */
                confirmWithMessage,
                ...props
            } = this.props;

            return (
                <React.Fragment>
                    <WrappedComponent
                        confirmReadyToReplaceProject={this.confirmReadyToReplaceProject}
                        shouldSaveBeforeTransition={this.shouldSaveBeforeTransition}
                        {...props}
                    />
                    {(this.state.showModal) && (
                        <NewProjectModal
                            exiting={this.state.exiting}
                            onCancel={this.handleNewProjectCancel}
                            onConfirm={this.handleNewProjectConfirm}
                        />
                    )}
                </React.Fragment>
            );
        }
    }

    MenuBarContainer.propTypes = {
        canCreateNew: PropTypes.bool,
        canSave: PropTypes.bool,
        projectChanged: PropTypes.shape({changed: PropTypes.bool, hasBeenSaved: PropTypes.bool}),
        confirmWithMessage: PropTypes.func
    };
    MenuBarContainer.defaultProps = {
        confirmWithMessage: (message, callback) => {
            confirmDialog(message).then(callback);
        }
    };
    const mapStateToProps = state => ({
        projectChanged: state.scratchGui.projectChanged
    });
    const mapDispatchToProps = () => ({});
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(MenuBarContainer);
};

export default MenuBarHOC;