const SET_BLOCKS_POSITION = 'scratch-gui/display-settings/SET_BLOCKS_POSITION';
const SET_AI_BAR_POSITION = 'scratch-gui/display-settings/SET_AI_BAR_POSITION';
const SET_STAGE_POSITION = 'scratch-gui/display-settings/SET_STAGE_POSITION';
const SET_BLOCKS_ANIMATING = 'scratch-gui/display-settings/SET_BLOCKS_ANIMATING';
const SET_SWIPE_ORDER = 'scratch-gui/display-settings/SET_SWIPE_ORDER';
const SET_HORIZONTAL_SWIPE_ORDER = 'scratch-gui/display-settings/SET_HORIZONTAL_SWIPE_ORDER';

const LS_BLOCKS_POS = 'scratch_display_blocks_pos';
const LS_AI_BAR_POS = 'scratch_display_ai_pos';
const LS_STAGE_POS = 'scratch_display_stage_pos';
const LS_SWIPE_ORDER = 'scratch_display_swipe_order';
const LS_HORIZONTAL_SWIPE_ORDER = 'scratch_display_horizontal_swipe_order';

function getInitialBlocksPos() {
    if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(LS_BLOCKS_POS);
        if (val === 'left' || val === 'right') return val;
    }
    return 'left';
}

function getInitialAiBarPos() {
    if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(LS_AI_BAR_POS);
        if (val === 'bottom' || val === 'top') return val;
    }
    return 'bottom';
}

function getInitialStagePos() {
    if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(LS_STAGE_POS);
        if (val === 'left' || val === 'right') return val;
    }
    return 'right';
}

function getInitialSwipeOrder() {
    if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(LS_SWIPE_ORDER);
        if (val === 'up-close-down-open' || val === 'up-open-down-close') return val;
    }
    // Default is inverted as requested by user ("mas q los inviertas")
    return 'up-close-down-open';
}

function getInitialHorizontalSwipeOrder() {
    if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(LS_HORIZONTAL_SWIPE_ORDER);
        if (val === 'left-close-right-open' || val === 'left-open-right-close') return val;
    }
    return 'left-close-right-open';
}

const initialState = {
    blocksPosition: getInitialBlocksPos(), // 'left' | 'right'
    aiBarPosition: getInitialAiBarPos(),   // 'bottom' | 'top'
    stagePosition: getInitialStagePos(),   // 'right' | 'left'
    blocksAnimating: null,                 // null | 'exiting-down' | 'entering-up'
    swipeOrder: getInitialSwipeOrder(),    // 'up-close-down-open' | 'up-open-down-close' (vertical)
    horizontalSwipeOrder: getInitialHorizontalSwipeOrder() // 'left-close-right-open' | 'left-open-right-close' (horizontal)
};

const reducer = function (state = initialState, action) {
    switch (action.type) {
    case SET_BLOCKS_POSITION:
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(LS_BLOCKS_POS, action.position);
            } catch (_) {}
        }
        return {
            ...state,
            blocksPosition: action.position
        };
    case SET_AI_BAR_POSITION:
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(LS_AI_BAR_POS, action.position);
            } catch (_) {}
        }
        return {
            ...state,
            aiBarPosition: action.position
        };
    case SET_STAGE_POSITION:
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(LS_STAGE_POS, action.position);
            } catch (_) {}
        }
        return {
            ...state,
            stagePosition: action.position
        };
    case SET_BLOCKS_ANIMATING:
        return {
            ...state,
            blocksAnimating: action.animState
        };
    case SET_SWIPE_ORDER:
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(LS_SWIPE_ORDER, action.swipeOrder);
            } catch (_) {}
        }
        return {
            ...state,
            swipeOrder: action.swipeOrder
        };
    case SET_HORIZONTAL_SWIPE_ORDER:
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(LS_HORIZONTAL_SWIPE_ORDER, action.horizontalSwipeOrder);
            } catch (_) {}
        }
        return {
            ...state,
            horizontalSwipeOrder: action.horizontalSwipeOrder
        };
    default:
        return state;
    }
};

const setBlocksPosition = function (position) {
    return {
        type: SET_BLOCKS_POSITION,
        position: position
    };
};

const setAiBarPosition = function (position) {
    return {
        type: SET_AI_BAR_POSITION,
        position: position
    };
};

const setStagePosition = function (position) {
    return {
        type: SET_STAGE_POSITION,
        position: position
    };
};

const setBlocksAnimating = function (animState) {
    return {
        type: SET_BLOCKS_ANIMATING,
        animState: animState
    };
};

const setSwipeOrder = function (swipeOrder) {
    return {
        type: SET_SWIPE_ORDER,
        swipeOrder: swipeOrder
    };
};

const setHorizontalSwipeOrder = function (horizontalSwipeOrder) {
    return {
        type: SET_HORIZONTAL_SWIPE_ORDER,
        horizontalSwipeOrder: horizontalSwipeOrder
    };
};

export {
    reducer as default,
    initialState as displaySettingsInitialState,
    setBlocksPosition,
    setAiBarPosition,
    setStagePosition,
    setBlocksAnimating,
    setSwipeOrder,
    setHorizontalSwipeOrder
};
