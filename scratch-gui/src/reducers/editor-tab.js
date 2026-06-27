const ACTIVATE_TAB = 'scratch-gui/navigation/ACTIVATE_TAB';
const SET_SECONDARY_TAB = 'scratch-gui/navigation/SET_SECONDARY_TAB';
const SET_SPLIT_RATIO = 'scratch-gui/navigation/SET_SPLIT_RATIO';
const SHOW_SPLIT_MENU = 'scratch-gui/navigation/SHOW_SPLIT_MENU';
const HIDE_SPLIT_MENU = 'scratch-gui/navigation/HIDE_SPLIT_MENU';
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
    splitMenuVisible: false,
    splitMenuPosition: null,
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
    case SHOW_SPLIT_MENU:
        return Object.assign({}, state, {
            splitMenuVisible: true,
            splitMenuPosition: action.position
        });
    case HIDE_SPLIT_MENU:
        return Object.assign({}, state, {
            splitMenuVisible: false,
            splitMenuPosition: null
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

const showSplitMenu = function (position) {
    return {
        type: SHOW_SPLIT_MENU,
        position: position
    };
};

const hideSplitMenu = function () {
    return {
        type: HIDE_SPLIT_MENU
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
        data: key
    };
};

export {
    reducer as default,
    initialState as editorTabInitialState,
    activateTab,
    setSecondaryTab,
    setSplitRatio,
    showSplitMenu,
    hideSplitMenu,
    setExplainPending,
    setProjectKey,
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX,
    AI_TAB_INDEX
};

