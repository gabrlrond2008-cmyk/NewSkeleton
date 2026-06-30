var SET_REDUCED_MOTION = 'scratch-gui/animations/SET_REDUCED_MOTION';

var initialState = {
    reducedMotion: false
};

var reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_REDUCED_MOTION:
        return Object.assign({}, state, {reducedMotion: action.reducedMotion});
    default:
        return state;
    }
};

var setReducedMotion = function (reducedMotion) {
    return {
        type: SET_REDUCED_MOTION,
        reducedMotion: reducedMotion
    };
};

export {
    reducer as default,
    initialState as animationsInitialState,
    setReducedMotion
};
