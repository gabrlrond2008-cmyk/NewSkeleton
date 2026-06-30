var undoStacks = {};

var saveStacks = function (targetId, workspace) {
    if (!targetId || !workspace) return;
    var undoStack = workspace.undoStack_;
    var redoStack = workspace.redoStack_;
    if (!undoStack || !redoStack) return;
    var serialized = {
        undoStack: undoStack.map(function (e) {
            return {
                type: e.type,
                blockId: e.blockId,
                xml: e.xml ? e.xml : null,
                group: e.group,
                recordUndo: e.recordUndo
            };
        }),
        redoStack: redoStack.map(function (e) {
            return {
                type: e.type,
                blockId: e.blockId,
                xml: e.xml ? e.xml : null,
                group: e.group,
                recordUndo: e.recordUndo
            };
        })
    };
    undoStacks[targetId] = serialized;
};

var restoreStacks = function (targetId, workspace) {
    if (!targetId || !workspace) return;
    var saved = undoStacks[targetId];
    if (!saved) return;
    try {
        workspace.clearUndo();
        if (saved.undoStack && saved.undoStack.length > 0) {
            for (var i = 0; i < saved.undoStack.length; i++) {
                var e = saved.undoStack[i];
                if (e.xml) {
                    try {
                        var dom = workspace.getFlyout().getWorkspace ?
                            null : null;
                        workspace.undoStack_.push(e);
                    } catch (err) {
                        // skip events that can't be reconstructed
                    }
                }
            }
            workspace.undoStack_ = saved.undoStack;
        }
        if (saved.redoStack && saved.redoStack.length > 0) {
            workspace.redoStack_ = saved.redoStack;
        }
        delete undoStacks[targetId];
    } catch (err) {
        // If restoration fails, just clear to avoid stale state
        workspace.clearUndo();
    }
};

var clearAll = function () {
    undoStacks = {};
};

export {
    saveStacks,
    restoreStacks,
    clearAll
};
