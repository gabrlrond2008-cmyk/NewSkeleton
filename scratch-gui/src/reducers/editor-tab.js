const ACTIVATE_TAB = 'scratch-gui/navigation/ACTIVATE_TAB';
const SET_SECONDARY_TAB = 'scratch-gui/navigation/SET_SECONDARY_TAB';
const SET_SPLIT_RATIO = 'scratch-gui/navigation/SET_SPLIT_RATIO';
const SWAP_TABS = 'scratch-gui/navigation/SWAP_TABS';
const REORDER_TABS = 'scratch-gui/navigation/REORDER_TABS';
const SET_EXPLAIN_PENDING = 'scratch-gui/navigation/SET_EXPLAIN_PENDING';
const SET_PROJECT_KEY = 'scratch-gui/navigation/SET_PROJECT_KEY';

const BLOCKS_TAB_INDEX = 0;
const COSTUMES_TAB_INDEX = 1;
const SOUNDS_TAB_INDEX = 2;
const AI_TAB_INDEX = 3;

var projectKeyCounter = 0;

const initialState = {
    activeTabIndex: BLOCKS_TAB_INDEX,
    secondaryTabIndex: null,
    splitPrimaryIndex: null,
    splitRatio: 0.5,
    tabOrder: [BLOCKS_TAB_INDEX, COSTUMES_TAB_INDEX, SOUNDS_TAB_INDEX, AI_TAB_INDEX],
    pendingExplain: null,
    projectKey: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case ACTIVATE_TAB:
        return Object.assign({}, state, {
            activeTabIndex: action.activeTabIndex
        });
    case SET_SECONDARY_TAB:
        return Object.assign({}, state, {
            secondaryTabIndex: action.tabIndex,
            splitPrimaryIndex: action.tabIndex != null ? state.activeTabIndex : null
        });
    case SET_SPLIT_RATIO:
        return Object.assign({}, state, {
            splitRatio: Math.max(0.2, Math.min(0.8, action.ratio))
        });
    case SWAP_TABS:
        return Object.assign({}, state, {
            activeTabIndex: state.secondaryTabIndex,
            secondaryTabIndex: state.activeTabIndex,
            splitPrimaryIndex: state.secondaryTabIndex
        });
    case REORDER_TABS:
        return Object.assign({}, state, {
            tabOrder: action.tabOrder
        });
    case SET_EXPLAIN_PENDING:
        return Object.assign({}, state, {
            pendingExplain: action.data
        });
    case SET_PROJECT_KEY:
        return Object.assign({}, state, {
            projectKey: action.data
        });
    default:
        return state;
    }
};

const activateTab = function (tab) {
    return {
        type: ACTIVATE_TAB,
        activeTabIndex: tab
    };
};

const setSecondaryTab = function (tabIndex) {
    return {
        type: SET_SECONDARY_TAB,
        tabIndex: tabIndex
    };
};

const setSplitRatio = function (ratio) {
    return {
        type: SET_SPLIT_RATIO,
        ratio: ratio
    };
};

const swapTabs = function () {
    return {
        type: SWAP_TABS
    };
};

const reorderTabs = function (tabOrder) {
    return {
        type: REORDER_TABS,
        tabOrder: tabOrder
    };
};

const setExplainPending = function (data) {
    return {
        type: SET_EXPLAIN_PENDING,
        data: data
    };
};

const setProjectKey = function (key) {
    return {
        type: SET_PROJECT_KEY,
        key: key
    };
};

export {
    reducer as default,
    initialState as editorTabInitialState,
    activateTab,
    setSecondaryTab,
    setSplitRatio,
    swapTabs,
    reorderTabs,
    setExplainPending,
    setProjectKey,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX,
    AI_TAB_INDEX
};
