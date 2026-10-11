import {ScratchStorage} from 'scratch-storage';

import defaultProject from './default-project';

/**
 * Wrapper for ScratchStorage which adds default web sources.
 * @todo make this more configurable
 */
class Storage extends ScratchStorage {
    constructor () {
        super();
        this.cacheDefaultProject();
        this.setAssetHost('https://cdn.assets.scratch.mit.edu');
        // Prevent hanging worker fetch in Desktop/Tauri/Webpack environments
        if (this.webHelper && this.webHelper.assetTool && Array.isArray(this.webHelper.assetTool.tools)) {
            this.webHelper.assetTool.tools = this.webHelper.assetTool.tools.filter(
                t => t.constructor.name === 'FetchTool' || !t.constructor.name.includes('Worker')
            );
        }
        this.addOfficialScratchWebStores();
    }
    addOfficialScratchWebStores () {
        // 1. Local bundled library assets take priority (instant load, 0 timeout, offline)
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap, this.AssetType.Sound],
            asset => {
                const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ?
                    window.location.origin : 'http://localhost:8601';
                return `${origin}/static/library-assets/${asset.assetId}.${asset.dataFormat}`;
            }
        );
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap, this.AssetType.Sound],
            asset => `http://localhost:8601/static/library-assets/${asset.assetId}.${asset.dataFormat}`
        );
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap, this.AssetType.Sound],
            asset => `static/library-assets/${asset.assetId}.${asset.dataFormat}`
        );
        this.addWebStore(
            [this.AssetType.Project],
            this.getProjectGetConfig.bind(this),
            this.getProjectCreateConfig.bind(this),
            this.getProjectUpdateConfig.bind(this)
        );
        this.addWebStore(
            [this.AssetType.ImageVector, this.AssetType.ImageBitmap, this.AssetType.Sound],
            this.getAssetGetConfig.bind(this),
            // We set both the create and update configs to the same method because
            // storage assumes it should update if there is an assetId, but the
            // asset store uses the assetId as part of the create URI.
            this.getAssetCreateConfig.bind(this),
            this.getAssetCreateConfig.bind(this)
        );
        this.addWebStore(
            [this.AssetType.Sound],
            asset => `static/extension-assets/scratch3_music/${asset.assetId}.${asset.dataFormat}`
        );
    }
    setProjectHost (projectHost) {
        this.projectHost = projectHost;
    }
    setProjectToken (projectToken) {
        this.projectToken = projectToken;
    }
    getProjectGetConfig (projectAsset) {
        const path = `${this.projectHost}/${projectAsset.assetId}`;
        const qs = this.projectToken ? `?token=${this.projectToken}` : '';
        return path + qs;
    }
    getProjectCreateConfig () {
        return {
            url: `${this.projectHost}/`,
            withCredentials: true
        };
    }
    getProjectUpdateConfig (projectAsset) {
        return {
            url: `${this.projectHost}/${projectAsset.assetId}`,
            withCredentials: true
        };
    }
    setAssetHost (assetHost) {
        this.assetHost = assetHost;
    }
    getAssetGetConfig (asset) {
        // Modern Scratch 3.0 asset CDN endpoint
        return `https://assets.scratch.mit.edu/${asset.assetId}.${asset.dataFormat}`;
    }
    getAssetCreateConfig (asset) {
        return {
            // There is no such thing as updating assets, but storage assumes it
            // should update if there is an assetId, and the asset store uses the
            // assetId as part of the create URI. So, force the method to POST.
            // Then when storage finds this config to use for the "update", still POSTs
            method: 'post',
            url: `${this.assetHost}/${asset.assetId}.${asset.dataFormat}`,
            withCredentials: true
        };
    }
    setTranslatorFunction (translator) {
        this.translator = translator;
        this.cacheDefaultProject();
    }
    cacheDefaultProject () {
        const defaultProjectAssets = defaultProject(this.translator);
        defaultProjectAssets.forEach(asset => this.builtinHelper._store(
            this.AssetType[asset.assetType],
            this.DataFormat[asset.dataFormat],
            asset.data,
            asset.id
        ));
    }
}

const storage = new Storage();

export default storage;
