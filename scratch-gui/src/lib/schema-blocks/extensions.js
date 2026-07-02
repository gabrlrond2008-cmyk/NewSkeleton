function registerFlatExtensions(Blockly) {
    if (!Blockly || !Blockly.ScratchBlocks || !Blockly.ScratchBlocks.VerticalExtensions) return;

    Blockly.ScratchBlocks.VerticalExtensions.SHAPE_FLAT_STATEMENT = function () {
        this.setInputsInline(true);
    };

    Blockly.ScratchBlocks.VerticalExtensions.SHAPE_FLAT_HAT = function () {
        this.setInputsInline(true);
    };

    Blockly.ScratchBlocks.VerticalExtensions.SHAPE_FLAT_END = function () {
        this.setInputsInline(true);
    };

    try {
        Blockly.Extensions.register('shape_flat_statement',
            Blockly.ScratchBlocks.VerticalExtensions.SHAPE_FLAT_STATEMENT);
        Blockly.Extensions.register('shape_flat_hat',
            Blockly.ScratchBlocks.VerticalExtensions.SHAPE_FLAT_HAT);
        Blockly.Extensions.register('shape_flat_end',
            Blockly.ScratchBlocks.VerticalExtensions.SHAPE_FLAT_END);
    } catch (e) {}
}

export {
    registerFlatExtensions
};
