import defaultsDeep from 'lodash.defaultsdeep';
import PropTypes from 'prop-types';
import React from 'react';
import VMScratchBlocks from '../lib/blocks';
import VM from 'scratch-vm';
import {connect} from 'react-redux';
import {BLOCKS_DEFAULT_SCALE} from '../lib/layout-constants';
import {DEFAULT_THEME, getColorsForTheme} from '../lib/themes';
import SchemaTabComponent from '../components/schema-tab/schema-tab.jsx';
import EdgeOverlay from '../components/edge-overlay/edge-overlay.jsx';
import {getEdgesFromConnections, flattenBlockSvgPaths} from '../lib/schema-blocks/index.js';

var DEFAULT_OPTIONS = {
    zoom: {controls: true, wheel: true, startScale: BLOCKS_DEFAULT_SCALE},
    grid: {spacing: 40, length: 2, colour: '#ddd'},
    comments: true, collapse: false, sounds: false
};

var _linePatchesApplied = false;

function applyLineConnectionsPatch(Blockly) {
    if (!Blockly || _linePatchesApplied) return;
    _linePatchesApplied = true;
    try {
        var fnBump = Blockly.BlockSvg && Blockly.BlockSvg.prototype.bumpNeighbours_;
        if (fnBump) {
            Blockly.BlockSvg.prototype.bumpNeighbours_ = function () {
                if (this.workspace && this.workspace.useLineConnections) return;
                return fnBump.call(this);
            };
        }
    } catch (e) {}
    try {
        var fnSnap = Blockly.BlockSvg && Blockly.BlockSvg.prototype.scheduleSnapAndBump;
        if (fnSnap) {
            Blockly.BlockSvg.prototype.scheduleSnapAndBump = function () {
                if (this.workspace && this.workspace.useLineConnections) return;
                return fnSnap.call(this);
            };
        }
    } catch (e) {}
    try {
        var fnRenderConnect = Blockly.RenderedConnection && Blockly.RenderedConnection.prototype.connect_;
        if (fnRenderConnect && Blockly.Connection) {
            Blockly.RenderedConnection.prototype.connect_ = function (targetConnection) {
                var ws = this.getSourceBlock().workspace;
                if (ws && ws.useLineConnections &&
                    (this.type === Blockly.NEXT_STATEMENT || this.type === Blockly.PREVIOUS_STATEMENT)) {
                    Blockly.Connection.prototype.connect_.call(this, targetConnection);
                    var b = this.getSourceBlock();
                    var a = targetConnection.getSourceBlock();
                    b.rendered && b.updateDisabled();
                    a.rendered && a.updateDisabled();
                    return;
                }
                return fnRenderConnect.call(this, targetConnection);
            };
        }
    } catch (e) {}
}

class SchemaTab extends React.Component {
    constructor(props) {
        super(props);
        this.state = {selectedEdgeId: null, edges: []};
        this.ScratchBlocks = VMScratchBlocks(props.vm, false);
        this._pushing = false;
    }
    componentDidMount() {
        console.log('[schema] componentDidMount, blocks:', !!this.blocks, 'toolboxXML:', !!this.props.toolboxXML);
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
        var workspaceConfig = defaultsDeep({},
            DEFAULT_OPTIONS,
            this.props.options,
            {
                rtl: this.props.isRtl,
                toolbox: this.props.toolboxXML || '',
                colours: getColorsForTheme(this.props.theme || DEFAULT_THEME)
            }
        );
        this.props.vm.on('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.on('targetsUpdate', this.onTargetsUpdate);
        if (this.blocks && this.props.toolboxXML) {
            console.log('[schema] componentDidMount: injecting workspace');
            applyLineConnectionsPatch(this.ScratchBlocks);
            flattenBlockSvgPaths(this.ScratchBlocks);
            this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);
            this.workspace.useLineConnections = true;
            this.workspace.addChangeListener(this.props.vm.blockListener);
            this.requestInitialWorkspace();
        }
    }
    componentDidUpdate(prevProps) {
        console.log('[schema] componentDidUpdate, ws:', !!this.workspace, 'blocks:', !!this.blocks, 'toolbox:', !!this.props.toolboxXML);
        if (!this.workspace && this.blocks && this.props.toolboxXML) {
            console.log('[schema] componentDidUpdate: injecting workspace');
            applyLineConnectionsPatch(this.ScratchBlocks);
            flattenBlockSvgPaths(this.ScratchBlocks);
            var workspaceConfig = defaultsDeep({},
                DEFAULT_OPTIONS,
                this.props.options,
                {
                    rtl: this.props.isRtl,
                    toolbox: this.props.toolboxXML,
                    colours: getColorsForTheme(this.props.theme || DEFAULT_THEME)
                }
            );
            this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);
            this.workspace.useLineConnections = true;
            this.workspace.addChangeListener(this.props.vm.blockListener);
            console.log('[schema] workspace injected, calling requestInitialWorkspace');
            this.requestInitialWorkspace();
            return;
        }
        if (this.workspace) {
            if (prevProps.locale !== this.props.locale) {
                this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
                this.ScratchBlocks.refreshStatusButtons(this.workspace);
            }
            if (this.props.toolboxXML && prevProps.toolboxXML !== this.props.toolboxXML) {
                this.workspace.updateToolbox(this.props.toolboxXML);
            }
        }
    }
    componentWillUnmount() {
        if (this.props.vm) {
            this.props.vm.removeListener('workspaceUpdate', this.onWorkspaceUpdate);
            this.props.vm.removeListener('targetsUpdate', this.onTargetsUpdate);
        }
        if (this.workspace) {
            this.workspace.removeChangeListener(this.props.vm.blockListener);
            this.workspace.dispose();
            this.workspace = null;
        }
    }
    onWorkspaceUpdate = function (data) {
        console.log('[schema] onWorkspaceUpdate called, pushing:', this._pushing, 'ws:', !!this.workspace, 'target:', this.props.vm && this.props.vm.editingTarget ? this.props.vm.editingTarget.id : 'none');
        if (this._pushing || !this.workspace || !this.props.vm.editingTarget) {
            console.warn('[schema] onWorkspaceUpdate skipped');
            return;
        }
        this._pushing = true;
        this.workspace.removeChangeListener(this.props.vm.blockListener);
        try {
            if (!data || !data.xml) {
                console.warn('[schema] onWorkspaceUpdate: no XML data');
                this.setState({edges: []});
                return;
            }
            console.log('[schema] XML length:', data.xml.length);
            var dom = this.ScratchBlocks.Xml.textToDom(data.xml);
            console.log('[schema] XML parsed, top blocks:', dom.querySelectorAll('block[type]').length);
            this.ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(dom, this.workspace);
            var allB = this.workspace.getAllBlocks(false);
            var edges = getEdgesFromConnections(this.workspace, this.ScratchBlocks);
            console.log('[schema] blocks:', allB.length, 'edges:', edges.length);
            allB.forEach(function (b) {
                console.log('  -', b.type, b.id, 'next:', !!b.nextConnection, 'prev:', !!b.previousConnection, 'inputs:', b.inputList ? b.inputList.length : 0);
            });
            this.setState({edges: edges});
        } catch (e) {
            console.error('[schema] onWorkspaceUpdate error:', e.message, e.stack);
        }
        this.workspace.addChangeListener(this.props.vm.blockListener);
        this._pushing = false;
    }.bind(this);
    requestInitialWorkspace = function () {
        try {
            if (this.props.vm && this.props.vm.emitWorkspaceUpdate) {
                this.props.vm.emitWorkspaceUpdate();
            }
        } catch (e) {}
    }.bind(this);
    onTargetsUpdate = function () {};
    handleEdgeSelect = function (edgeId) {
        this.setState(function (prev) {
            return {selectedEdgeId: prev.selectedEdgeId === edgeId ? null : edgeId};
        });
    }.bind(this);
    setBlocks = function (container) {
        this.blocks = container;
    }.bind(this);
    render() {
        return (
            <div style={{position: 'relative', width: '100%', height: '100%'}}>
                <SchemaTabComponent
                    containerRef={this.setBlocks}
                />
                {this.workspace && this.ScratchBlocks && (
                    <EdgeOverlay
                        workspace={this.workspace}
                        Blockly={this.ScratchBlocks}
                        edges={this.state.edges}
                        onEdgeSelect={this.handleEdgeSelect}
                        selectedEdgeId={this.state.selectedEdgeId}
                    />
                )}
            </div>
        );
    }
}

SchemaTab.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired,
    options: PropTypes.object,
    toolboxXML: PropTypes.string,
    isRtl: PropTypes.bool,
    locale: PropTypes.string,
    theme: PropTypes.string,
    reducedMotion: PropTypes.bool
};

var mapStateToProps = function (state) {
    return {
        toolboxXML: state.scratchGui && state.scratchGui.toolbox && state.scratchGui.toolbox.toolboxXML,
        isRtl: state.locales && state.locales.isRtl,
        locale: state.locales && state.locales.locale,
        theme: state.scratchGui && state.scratchGui.theme && state.scratchGui.theme.theme,
        reducedMotion: state.scratchGui && state.scratchGui.animations && state.scratchGui.animations.reducedMotion
    };
};

export default connect(mapStateToProps)(SchemaTab);
