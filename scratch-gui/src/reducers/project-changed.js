const SET_PROJECT_CHANGED = 'scratch-gui/project-changed/SET_PROJECT_CHANGED';
const SET_HAS_BEEN_SAVED = 'scratch-gui/project-changed/SET_HAS_BEEN_SAVED';

const initialState = {
    changed: false,
    hasBeenSaved: false
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_PROJECT_CHANGED:
        return Object.assign({}, state, {changed: action.changed});
    case SET_HAS_BEEN_SAVED:
        return Object.assign({}, state, {hasBeenSaved: true});
    default:
        return state;
    }
};
const setProjectChanged = () => ({
    type: SET_PROJECT_CHANGED,
    changed: true
});
const setProjectUnchanged = () => ({
    type: SET_PROJECT_CHANGED,
    changed: false
});
const setHasBeenSaved = () => ({
    type: SET_HAS_BEEN_SAVED
});

export {
    reducer as default,
    initialState as projectChangedInitialState,
    setProjectChanged,
    setProjectUnchanged,
    setHasBeenSaved
};
