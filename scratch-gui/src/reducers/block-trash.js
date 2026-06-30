var TRASH_ADD = 'scratch-gui/block-trash/TRASH_ADD';
var TRASH_REMOVE_FIRST = 'scratch-gui/block-trash/TRASH_REMOVE_FIRST';
var TRASH_CLEAR = 'scratch-gui/block-trash/TRASH_CLEAR';

var MAX_TRASH = 10;

var initialState = {
    blocks: []
};

var reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case TRASH_ADD: {
        var blocks = state.blocks.slice();
        blocks.push({
            id: action.id,
            xml: action.xml,
            opcode: action.opcode,
            timestamp: Date.now()
        });
        if (blocks.length > MAX_TRASH) {
            blocks.shift();
        }
        return Object.assign({}, state, {blocks: blocks});
    }
    case TRASH_REMOVE_FIRST: {
        var blocks = state.blocks.slice();
        if (blocks.length > 0) {
            blocks.shift();
        }
        return Object.assign({}, state, {blocks: blocks});
    }
    case TRASH_CLEAR:
        return Object.assign({}, state, {blocks: []});
    default:
        return state;
    }
};

var addTrashBlock = function (id, xml, opcode) {
    return {
        type: TRASH_ADD,
        id: id,
        xml: xml,
        opcode: opcode
    };
};

var removeFirstTrashBlock = function () {
    return {
        type: TRASH_REMOVE_FIRST
    };
};

var clearTrash = function () {
    return {
        type: TRASH_CLEAR
    };
};

export {
    reducer as default,
    initialState as blockTrashInitialState,
    addTrashBlock,
    removeFirstTrashBlock,
    clearTrash
};
