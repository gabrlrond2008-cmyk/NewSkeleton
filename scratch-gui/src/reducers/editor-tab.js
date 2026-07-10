const OPEN_TAB = 'scratch-gui/navigation/OPEN_TAB';
const CLOSE_TAB = 'scratch-gui/navigation/CLOSE_TAB';
const SET_ACTIVE_TAB = 'scratch-gui/navigation/SET_ACTIVE_TAB';
const SET_SECONDARY_TAB = 'scratch-gui/navigation/SET_SECONDARY_TAB';
const SET_SPLIT_RATIO = 'scratch-gui/navigation/SET_SPLIT_RATIO';
const SWAP_TABS = 'scratch-gui/navigation/SWAP_TABS';
const REORDER_TABS = 'scratch-gui/navigation/REORDER_TABS';
const SET_EXPLAIN_PENDING = 'scratch-gui/navigation/SET_EXPLAIN_PENDING';
const SET_PROJECT_KEY = 'scratch-gui/navigation/SET_PROJECT_KEY';
const RESTORE_TABS = 'scratch-gui/navigation/RESTORE_TABS';

const CODE_TAB = 'code';
const COSTUMES_TAB = 'costumes';
const SOUNDS_TAB = 'sounds';
const AI_TAB = 'ai';
const SIMULATION_TAB = 'simulacion';
const CONTROL_TAB = 'control';
const CIRCUITOS_TAB = 'circuitos';
const TAB_3D = '3d';

var projectKeyCounter = 0;

const ALL_TABS = [CODE_TAB, COSTUMES_TAB, SOUNDS_TAB, AI_TAB, SIMULATION_TAB, CONTROL_TAB, CIRCUITOS_TAB, TAB_3D];

const initialState = {
    activeTabId: CODE_TAB,
    openTabs: [CODE_TAB],
    hiddenTabs: [],
    tabsData: {},
    secondaryTabId: null,
    splitPrimaryIndex: null,
    splitRatio: 0.5,
    pendingExplain: null,
    projectKey: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case OPEN_TAB: {
        if (state.openTabs.indexOf(action.tabId) !== -1) return state;
        const newOpenTabs = state.openTabs.concat([action.tabId]);
        const newHiddenTabs = state.hiddenTabs.filter(function (t) { return t !== action.tabId; });
        return Object.assign({}, state, {
            openTabs: newOpenTabs,
            hiddenTabs: newHiddenTabs,
            activeTabId: action.tabId
        });
    }
    case CLOSE_TAB: {
        const idx = state.openTabs.indexOf(action.tabId);
        if (idx === -1 || action.tabId === CODE_TAB) return state;
        const newOpenTabs = state.openTabs.filter(function (t) { return t !== action.tabId; });
        const newHiddenTabs = state.hiddenTabs.indexOf(action.tabId) === -1 ?
            state.hiddenTabs.concat([action.tabId]) : state.hiddenTabs;
        var newActive = state.activeTabId;
        if (state.activeTabId === action.tabId) {
            newActive = newOpenTabs[Math.max(0, idx - 1)] || CODE_TAB;
        }
        var newSecondary = state.secondaryTabId;
        if (state.secondaryTabId === action.tabId) {
            newSecondary = null;
        }
        return Object.assign({}, state, {
            openTabs: newOpenTabs,
            hiddenTabs: newHiddenTabs,
            activeTabId: newActive,
            secondaryTabId: newSecondary,
            splitPrimaryIndex: newSecondary != null ? state.splitPrimaryIndex : null
        });
    }
    case SET_ACTIVE_TAB:
        return Object.assign({}, state, {
            activeTabId: action.tabId
        });
    case SET_SECONDARY_TAB:
        return Object.assign({}, state, {
            secondaryTabId: action.tabId,
            splitPrimaryIndex: action.tabId != null ? state.activeTabId : null
        });
    case SET_SPLIT_RATIO:
        return Object.assign({}, state, {
            splitRatio: Math.max(0.2, Math.min(0.8, action.ratio))
        });
    case SWAP_TABS:
        return Object.assign({}, state, {
            activeTabId: state.secondaryTabId,
            secondaryTabId: state.activeTabId,
            splitPrimaryIndex: state.secondaryTabId
        });
    case REORDER_TABS:
        return Object.assign({}, state, {
            openTabs: action.newOrder
        });
    case SET_EXPLAIN_PENDING:
        return Object.assign({}, state, {
            pendingExplain: action.data
        });
    case SET_PROJECT_KEY:
        return Object.assign({}, state, {
            projectKey: action.data
        });
    case RESTORE_TABS:
        return Object.assign({}, state, {
            activeTabId: action.data.activeTabId || CODE_TAB,
            openTabs: action.data.openTabs && action.data.openTabs.length > 0 ?
                action.data.openTabs : [CODE_TAB],
            hiddenTabs: [],
            tabsData: action.data.tabsData || {},
            secondaryTabId: null,
            splitPrimaryIndex: null
        });
    default:
        return state;
    }
};

const openTab = function (tabId) {
    return {type: OPEN_TAB, tabId: tabId};
};

const closeTab = function (tabId) {
    return {type: CLOSE_TAB, tabId: tabId};
};

const setActiveTab = function (tabId) {
    return {type: SET_ACTIVE_TAB, tabId: tabId};
};

// Backward compatibility alias
const activateTab = setActiveTab;

const setSecondaryTab = function (tabId) {
    return {type: SET_SECONDARY_TAB, tabId: tabId};
};

const setSplitRatio = function (ratio) {
    return {type: SET_SPLIT_RATIO, ratio: ratio};
};

const swapTabs = function () {
    return {type: SWAP_TABS};
};

const reorderTabs = function (newOrder) {
    return {type: REORDER_TABS, newOrder: newOrder};
};

const setExplainPending = function (data) {
    return {type: SET_EXPLAIN_PENDING, data: data};
};

const setProjectKey = function (key) {
    return {type: SET_PROJECT_KEY, key: key};
};

const restoreTabs = function (data) {
    return {type: RESTORE_TABS, data: data};
};

export {
    reducer as default,
    initialState as editorTabInitialState,
    openTab,
    closeTab,
    setActiveTab,
    activateTab,
    setSecondaryTab,
    setSplitRatio,
    swapTabs,
    reorderTabs,
    setExplainPending,
    setProjectKey,
    restoreTabs,
    CODE_TAB,
    COSTUMES_TAB,
    SOUNDS_TAB,
    AI_TAB,
    SIMULATION_TAB,
    CONTROL_TAB,
    CIRCUITOS_TAB,
    TAB_3D,
    ALL_TABS
};
