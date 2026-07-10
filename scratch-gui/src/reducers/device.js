const SET_SELECTED_DEVICE = 'scratch-gui/device/SET_SELECTED_DEVICE';
const SET_DEVICE_LOADING = 'scratch-gui/device/SET_DEVICE_LOADING';
const SET_DEVICE_ERROR = 'scratch-gui/device/SET_DEVICE_ERROR';

const initialState = {
    selectedDevice: null,
    deviceLoading: false,
    deviceError: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_SELECTED_DEVICE:
        return Object.assign({}, state, {
            selectedDevice: action.device,
            deviceError: null,
            deviceLoading: false
        });
    case SET_DEVICE_LOADING:
        return Object.assign({}, state, {
            deviceLoading: action.loading
        });
    case SET_DEVICE_ERROR:
        return Object.assign({}, state, {
            deviceError: action.error,
            deviceLoading: false
        });
    default:
        return state;
    }
};

const setSelectedDevice = function (device) {
    return {
        type: SET_SELECTED_DEVICE,
        device: device
    };
};
const clearSelectedDevice = function () {
    return {
        type: SET_SELECTED_DEVICE,
        device: null
    };
};
const setDeviceLoading = function (loading) {
    return {
        type: SET_DEVICE_LOADING,
        loading: loading
    };
};
const setDeviceError = function (error) {
    return {
        type: SET_DEVICE_ERROR,
        error: error
    };
};

export {
    reducer as default,
    initialState as deviceInitialState,
    setSelectedDevice,
    clearSelectedDevice,
    setDeviceLoading,
    setDeviceError
};
