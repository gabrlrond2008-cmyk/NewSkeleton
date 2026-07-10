const VirtualMachine = require('./virtual-machine');

const ArgumentType = require('./extension-support/argument-type');
const BlockType = require('./extension-support/block-type');
const EVMDeviceManager = require('./engine/evm-device-manager');

module.exports = VirtualMachine;

// TODO: ESM named exports will save us all
module.exports.ArgumentType = ArgumentType;
module.exports.BlockType = BlockType;
module.exports.EVMDeviceManager = EVMDeviceManager;
