const builtinDevices = {};

const registerDevice = function (id, factory) {
    builtinDevices[id] = factory;
};

registerDevice('arduinoUno', () => require('./arduinoUno'));
registerDevice('arduinoMega2560', () => require('./arduinoMega2560'));
registerDevice('stBoardExtension', () => require('./stBoardExtension'));
registerDevice('stbBoardV2', () => require('./stbBoardV2'));

module.exports = {
    EVMBuiltinDevices: builtinDevices,
    registerDevice: registerDevice
};
