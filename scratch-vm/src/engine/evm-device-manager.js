const log = require('../util/log');
const {EVMBuiltinDevices} = require('../devices');
const EVMCodeGenerator = require('./evm-code-generator');

class EVMDeviceManager {
    constructor (runtime) {
        this.runtime = runtime;
        this._currentDevice = null;
        this._registeredCategoryIds = [];
        this.codeGenerator = new EVMCodeGenerator();
    }

    loadDevice (deviceId) {
        if (!EVMBuiltinDevices.hasOwnProperty(deviceId)) {
            return Promise.reject(new Error(`Device not found: ${deviceId}`));
        }

        this.clearDevice();

        const DeviceClass = EVMBuiltinDevices[deviceId]();
        const deviceInstance = new DeviceClass(this.runtime, deviceId);
        const categories = deviceInstance.getInfo();

        if (!Array.isArray(categories)) {
            return Promise.reject(new Error(
                `Device ${deviceId} getInfo() must return an array of categories`
            ));
        }

        this._currentDevice = {
            deviceId: deviceId,
            instance: deviceInstance,
            categories: categories
        };

        categories.forEach(category => {
            this.runtime.registerDeviceCategory(category);
            this._registeredCategoryIds.push(category.id);
        });

        this.runtime.emit(this.runtime.constructor.EVM_DEVICE_LOADED, {
            deviceId: deviceId,
            categories: this._registeredCategoryIds
        });

        log.info(`EVM: Device ${deviceId} loaded with ${categories.length} categories`);
        return Promise.resolve();
    }

    clearDevice () {
        if (!this._currentDevice) return;

        this.runtime.unregisterDeviceCategories();

        this.runtime.emit(this.runtime.constructor.EVM_DEVICE_CLEARED, {
            deviceId: this._currentDevice.deviceId
        });

        log.info(`EVM: Device ${this._currentDevice.deviceId} cleared`);
        this._currentDevice = null;
        this._registeredCategoryIds = [];
    }

    getCurrentDevice () {
        return this._currentDevice;
    }

    isDeviceLoaded () {
        return this._currentDevice !== null;
    }
}

module.exports = EVMDeviceManager;
