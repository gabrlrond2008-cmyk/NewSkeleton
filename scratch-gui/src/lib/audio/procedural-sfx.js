/**
 * src/lib/audio/procedural-sfx.js
 * Ultra-lightweight procedural WebAudio SFX synthesizer for Scratch.
 * Generates 8-bit, retro, and modern game sound effects instantly in memory
 * as standard WAV audio buffers with zero network calls or external APIs.
 */

/**
 * Convert a Float32Array of audio samples [-1.0, 1.0] to a valid WAV ArrayBuffer
 */
function samplesToWav(samples, sampleRate = 22050) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = samples.length * (bitsPerSample / 8);
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM 16-bit samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }

    return buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Procedural synthesizers for different sound effects
 */
const SYNTHS = {
    jump: (sampleRate) => {
        const duration = 0.22;
        const totalSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(totalSamples);
        let phase = 0;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / totalSamples;
            // Frequency sweeps from 180Hz to 620Hz
            const freq = 180 + 440 * (t * t);
            phase += (2 * Math.PI * freq) / sampleRate;
            // Square/triangle mix
            const val = Math.sin(phase) > 0 ? 0.7 : -0.7;
            const env = 1 - t; // Linear fade out
            samples[i] = val * env * 0.7;
        }
        return samples;
    },

    laser: (sampleRate) => {
        const duration = 0.18;
        const totalSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(totalSamples);
        let phase = 0;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / totalSamples;
            // Fast downward exponential pitch drop
            const freq = 880 * Math.pow(0.08, t);
            phase += (2 * Math.PI * freq) / sampleRate;
            const val = Math.sin(phase);
            const env = Math.pow(1 - t, 1.5);
            samples[i] = val * env * 0.75;
        }
        return samples;
    },

    coin: (sampleRate) => {
        const duration = 0.32;
        const totalSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(totalSamples);
        let phase = 0;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / totalSamples;
            // Two-tone chime: tone 1 (987Hz) for first 35%, then tone 2 (1318Hz)
            const freq = t < 0.35 ? 987 : 1318;
            phase += (2 * Math.PI * freq) / sampleRate;
            const val = Math.sin(phase) + 0.3 * Math.sin(phase * 2);
            const env = t < 0.35 ? 1 : Math.max(0, 1 - (t - 0.35) / 0.65);
            samples[i] = val * env * 0.6;
        }
        return samples;
    },

    explosion: (sampleRate) => {
        const duration = 0.45;
        const totalSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(totalSamples);
        let lastVal = 0;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / totalSamples;
            // Low-pass filtered noise
            const white = Math.random() * 2 - 1;
            lastVal = (lastVal + (0.15 * white)) / 1.15;
            const env = Math.pow(1 - t, 2.0);
            samples[i] = lastVal * env * 0.9;
        }
        return samples;
    },

    hit: (sampleRate) => {
        const duration = 0.15;
        const totalSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(totalSamples);
        let phase = 0;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / totalSamples;
            const freq = 220 * Math.pow(0.2, t);
            phase += (2 * Math.PI * freq) / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.3;
            const val = (Math.sin(phase) + noise);
            const env = Math.pow(1 - t, 1.8);
            samples[i] = val * env * 0.8;
        }
        return samples;
    },

    powerup: (sampleRate) => {
        const duration = 0.38;
        const totalSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(totalSamples);
        let phase = 0;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / totalSamples;
            // 3-note ascending arpeggio (C5 -> E5 -> G5 -> C6)
            let freq = 523; // C5
            if (t > 0.66) freq = 1046; // C6
            else if (t > 0.33) freq = 659; // E5
            phase += (2 * Math.PI * freq) / sampleRate;
            const val = Math.sin(phase);
            const env = 1 - (t * 0.4);
            samples[i] = val * env * 0.65;
        }
        return samples;
    },

    click: (sampleRate) => {
        const duration = 0.05;
        const totalSamples = Math.floor(sampleRate * duration);
        const samples = new Float32Array(totalSamples);
        let phase = 0;

        for (let i = 0; i < totalSamples; i++) {
            const t = i / totalSamples;
            const freq = 1200 * (1 - t);
            phase += (2 * Math.PI * freq) / sampleRate;
            samples[i] = Math.sin(phase) * (1 - t) * 0.5;
        }
        return samples;
    }
};

/**
 * Generate a procedural sound effect as a WAV Buffer & Data URL
 * @param {'jump'|'laser'|'coin'|'explosion'|'hit'|'powerup'|'click'} type
 * @param {number} [sampleRate=22050]
 */
export function generateProceduralSfx(type = 'jump', sampleRate = 22050) {
    const synthFn = SYNTHS[type] || SYNTHS.jump;
    const samples = synthFn(sampleRate);
    const wavBuffer = samplesToWav(samples, sampleRate);
    const uint8 = new Uint8Array(wavBuffer);

    // Convert to base64
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    const base64 = (typeof window !== 'undefined' && window.btoa) ? window.btoa(binary) : '';
    const dataUrl = `data:audio/wav;base64,${base64}`;

    return {
        type,
        sampleRate,
        sampleCount: samples.length,
        duration: samples.length / sampleRate,
        arrayBuffer: wavBuffer,
        uint8Array: uint8,
        dataUrl
    };
}

/**
 * Inject a procedurally generated sound directly into a VM sprite or Stage
 */
export async function addProceduralSoundToVM(vm, targetId, soundName, sfxType = 'jump') {
    if (!vm || !vm.runtime) return null;

    const sfx = generateProceduralSfx(sfxType);
    const target = targetId ? vm.runtime.getTargetById(targetId) : vm.editingTarget;
    if (!target) return null;

    // Use crypto hash for assetId or MD5 in storage
    const crypto = (typeof window !== 'undefined' && window.crypto) ? window.crypto : null;
    let hashStr = '';
    if (crypto && crypto.subtle) {
        const hashBuf = await crypto.subtle.digest('SHA-256', sfx.arrayBuffer);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        hashStr = hashArr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    } else {
        hashStr = 'sfx_' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10);
    }

    const md5ext = `${hashStr}.wav`;

    // Cache directly into storage
    if (vm.runtime.storage && vm.runtime.storage.builtinHelper) {
        vm.runtime.storage.builtinHelper._store(
            vm.runtime.storage.AssetType.Sound,
            'wav',
            sfx.uint8Array,
            hashStr
        );
    }

    const soundDescriptor = {
        name: soundName || `${sfxType}_sfx`,
        assetId: hashStr,
        dataFormat: 'wav',
        format: '',
        rate: sfx.sampleRate,
        sampleCount: sfx.sampleCount,
        md5ext: md5ext
    };

    if (typeof vm.addSound === 'function') {
        await vm.addSound(soundDescriptor, target.id);
    } else if (Array.isArray(target.sprite.sounds)) {
        target.sprite.sounds.push(soundDescriptor);
    }

    if (vm.emitTargetsUpdate) vm.emitTargetsUpdate(false);
    return soundDescriptor;
}
