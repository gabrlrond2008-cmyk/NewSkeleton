import {BitmapAdapter as V2BitmapAdapter} from 'scratch-svg-renderer';

function ensureV2Adapter(vm) {
    if (vm.attachV2BitmapAdapter && typeof vm.attachV2BitmapAdapter === 'function' && !vm.runtime.v2BitmapAdapter) {
        vm.attachV2BitmapAdapter(new V2BitmapAdapter());
    }
}

function createVMAsset(storage, dataFormat, data) {
    var asset = storage.createAsset(
        storage.AssetType.ImageBitmap,
        dataFormat,
        data,
        null,
        true
    );
    return {
        name: null,
        dataFormat: dataFormat,
        asset: asset,
        md5: asset.assetId + '.' + dataFormat,
        assetId: asset.assetId
    };
}

function resizeImage(dataURL, maxW, maxH, fillWhite) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = maxW;
            canvas.height = maxH;
            var ctx = canvas.getContext('2d');
            if (fillWhite) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, maxW, maxH);
            }
            var scale = Math.min(maxW / img.width, maxH / img.height);
            var w = Math.round(img.width * scale);
            var h = Math.round(img.height * scale);
            var x = Math.round((maxW - w) / 2);
            var y = Math.round((maxH - h) / 2);
            ctx.drawImage(img, x, y, w, h);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function () {
            reject(new Error('No se pudo decodificar la imagen'));
        };
        img.src = dataURL;
    });
}

function generatePlaceholderDataURL(name, bgColor) {
    var canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    var ctx = canvas.getContext('2d');
    
    // Nice rounded square badge
    ctx.fillStyle = bgColor || '#4C97FF';
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(10, 10, 140, 140, 24);
    } else {
        ctx.arc(80, 80, 70, 0, 2 * Math.PI);
    }
    ctx.fill();
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var shortName = String(name || 'Sprite').substring(0, 9);
    ctx.fillText(shortName, 80, 80);
    return canvas.toDataURL('image/png');
}

function addToTarget(imageDataURL, vm, targetId, name) {
    var storage = vm.runtime && vm.runtime.storage;
    if (!storage) {
        return Promise.reject(new Error('Storage no disponible'));
    }
    var stageId = vm.runtime.getTargetForStage && vm.runtime.getTargetForStage() &&
        vm.runtime.getTargetForStage().id;
    var isStage = targetId === stageId;
    return resizeImage(imageDataURL, 480, 360, isStage).then(function (resizedDataURL) {
        ensureV2Adapter(vm);
        var bitmapAdapter = new V2BitmapAdapter();
        return bitmapAdapter.importBitmap(resizedDataURL, 'image/png').then(function (dataBuffer) {
            var vmCostume = createVMAsset(storage, storage.DataFormat.PNG, dataBuffer);
            vmCostume.name = name;
            vmCostume.bitmapResolution = 2;
            vmCostume.rotationCenterX = 240;
            vmCostume.rotationCenterY = 180;
            return vm.addCostume(vmCostume.md5, vmCostume, targetId).then(function () {
                if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
                return {target: isStage ? 'backdrop' : 'sprite', name: vmCostume.name, success: true};
            });
        });
    });
}

function addNewSpriteFromImage(imageDataURL, vm, spriteName) {
    var storage = vm.runtime && vm.runtime.storage;
    if (!storage) {
        return Promise.reject(new Error('Storage no disponible'));
    }

    var validDataURL = imageDataURL || generatePlaceholderDataURL(spriteName);

    return resizeImage(validDataURL, 240, 240, false).then(function (resizedDataURL) {
        ensureV2Adapter(vm);
        var bitmapAdapter = new V2BitmapAdapter();
        return bitmapAdapter.importBitmap(resizedDataURL, 'image/png').then(function (dataBuffer) {
            var vmCostume = createVMAsset(storage, storage.DataFormat.PNG, dataBuffer);
            vmCostume.name = 'disfraz-' + spriteName;
            vmCostume.bitmapResolution = 2;
            vmCostume.rotationCenterX = 120;
            vmCostume.rotationCenterY = 120;

            var newSpriteObj = {
                name: spriteName,
                isStage: false,
                x: 0,
                y: 0,
                visible: true,
                size: 100,
                rotationStyle: 'all around',
                direction: 90,
                draggable: false,
                currentCostume: 0,
                blocks: {},
                variables: {},
                costumes: [vmCostume],
                sounds: []
            };

            return vm.addSprite(JSON.stringify(newSpriteObj)).then(function () {
                if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
                var targets = vm.runtime.targets || [];
                for (var i = 0; i < targets.length; i++) {
                    var t = targets[i];
                    if (!t.isStage && t.getName() && t.getName().toLowerCase() === spriteName.toLowerCase()) {
                        return t;
                    }
                }
                return targets[targets.length - 1];
            });
        });
    }).catch(function (err) {
        console.warn('[SpriteFromImage] Fallback a sprite básico:', spriteName, err);
        var fallbackURL = generatePlaceholderDataURL(spriteName);
        return resizeImage(fallbackURL, 160, 160, false).then(function (fallbackResized) {
            var bitmapAdapter = new V2BitmapAdapter();
            return bitmapAdapter.importBitmap(fallbackResized, 'image/png').then(function (buf) {
                var vmCostume = createVMAsset(storage, storage.DataFormat.PNG, buf);
                vmCostume.name = 'disfraz-' + spriteName;
                vmCostume.bitmapResolution = 2;
                vmCostume.rotationCenterX = 80;
                vmCostume.rotationCenterY = 80;

                var fallbackSprite = {
                    name: spriteName,
                    isStage: false,
                    x: 0,
                    y: 0,
                    visible: true,
                    size: 100,
                    rotationStyle: 'all around',
                    direction: 90,
                    draggable: false,
                    currentCostume: 0,
                    blocks: {},
                    variables: {},
                    costumes: [vmCostume],
                    sounds: []
                };
                return vm.addSprite(JSON.stringify(fallbackSprite)).then(function () {
                    if (vm.emitTargetsUpdate) vm.emitTargetsUpdate();
                    var targets = vm.runtime.targets || [];
                    return targets[targets.length - 1];
                });
            });
        });
    });
}

function addAsCostume(imageDataURL, vm) {
    var targetId = vm.editingTarget ? vm.editingTarget.id : null;
    if (!targetId) {
        return Promise.reject(new Error('No hay un sprite seleccionado'));
    }
    return addToTarget(imageDataURL, vm, targetId, 'generado-' + Date.now());
}

function addAsBackdrop(imageDataURL, vm) {
    var stage = vm.runtime && (vm.runtime.getTargetForStage ? vm.runtime.getTargetForStage() : null);
    var stageId = stage ? stage.id : 0;
    return addToTarget(imageDataURL, vm, stageId, 'fondo-generado-' + Date.now());
}

export {
    addAsCostume,
    addAsBackdrop,
    addToTarget,
    addNewSpriteFromImage,
    generatePlaceholderDataURL
};
