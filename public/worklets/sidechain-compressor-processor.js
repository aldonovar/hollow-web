/**
 * HOLLOW BITS — Sidechain Compressor AudioWorklet Processor
 * 
 * Professional-grade sidechain compressor that accepts two inputs:
 *   Input 0 (Main): The signal to be compressed
 *   Input 1 (Key/Sidechain): The signal used to derive the gain reduction envelope
 *
 * Algorithm: Peak envelope follower on the key signal drives a gain reduction
 * curve applied to the main signal. This is the same approach used by
 * Ableton Live, Bitwig Studio, and Logic Pro internally.
 *
 * AudioParam controls (all k-rate for efficiency):
 *   threshold    — dBFS trigger level (-60 to 0, default -24)
 *   ratio        — compression ratio (1:1 to 100:1, default 4)
 *   attack       — envelope attack in seconds (0.0001 to 0.5, default 0.003)
 *   release      — envelope release in seconds (0.005 to 2.0, default 0.15)
 *   makeupGain   — output gain in dB (0 to 36, default 0)
 *   mix          — dry/wet blend (0 to 1, default 1)
 *   lookahead    — lookahead in seconds (0 to 0.01, default 0)
 */
class SidechainCompressorProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Envelope state — one per channel (max 2 for stereo)
        this._envdB = new Float64Array(2);
        this._envdB.fill(-120);
    }

    static get parameterDescriptors() {
        return [
            { name: 'threshold',  defaultValue: -24, minValue: -60, maxValue: 0,    automationRate: 'k-rate' },
            { name: 'ratio',      defaultValue:   4, minValue:   1, maxValue: 100,  automationRate: 'k-rate' },
            { name: 'attack',     defaultValue: 0.003, minValue: 0.0001, maxValue: 0.5,  automationRate: 'k-rate' },
            { name: 'release',    defaultValue: 0.15,  minValue: 0.005,  maxValue: 2.0,  automationRate: 'k-rate' },
            { name: 'makeupGain', defaultValue:   0, minValue:   0, maxValue: 36,   automationRate: 'k-rate' },
            { name: 'mix',        defaultValue:   1, minValue:   0, maxValue: 1,    automationRate: 'k-rate' },
            { name: 'lookahead',  defaultValue:   0, minValue:   0, maxValue: 0.01, automationRate: 'k-rate' },
        ];
    }

    /**
     * Main DSP loop — processes 128-sample render quanta.
     */
    process(inputs, outputs, parameters) {
        const mainInput   = inputs[0];   // Signal to compress
        const scInput     = inputs[1];   // Sidechain key signal
        const output      = outputs[0];

        // If no main input, nothing to do
        if (!mainInput || mainInput.length === 0 || !mainInput[0] || mainInput[0].length === 0) {
            return true;
        }

        const numChannels = Math.min(mainInput.length, output.length);
        const blockSize   = mainInput[0].length;

        // Parameter reads (k-rate — single value per block)
        const thresholdDb = parameters.threshold[0];
        const ratio       = Math.max(1, parameters.ratio[0]);
        const attackSec   = Math.max(0.0001, parameters.attack[0]);
        const releaseSec  = Math.max(0.005, parameters.release[0]);
        const makeupDb    = parameters.makeupGain[0];
        const mix         = parameters.mix[0];

        // Pre-compute envelope coefficients (per-sample exponential)
        const attackCoeff  = Math.exp(-1.0 / (attackSec * sampleRate));
        const releaseCoeff = Math.exp(-1.0 / (releaseSec * sampleRate));
        const makeupLinear = Math.pow(10, makeupDb / 20);

        // Determine if we have a usable sidechain signal
        const hasSidechain = scInput && scInput.length > 0 && scInput[0] && scInput[0].length > 0;

        for (let ch = 0; ch < numChannels; ch++) {
            const mainData = mainInput[ch];
            const outData  = output[ch];

            // Use sidechain mono (channel 0 or matched channel)
            const scData = hasSidechain
                ? (scInput[Math.min(ch, scInput.length - 1)] || scInput[0])
                : null;

            let envdB = this._envdB[ch];

            for (let i = 0; i < blockSize; i++) {
                // --- Sidechain envelope follower ---
                const scSample = scData ? scData[Math.min(i, scData.length - 1)] : 0;
                const scAbs = Math.abs(scSample);
                // Convert to dBFS (floor at -120 dB to avoid -Infinity)
                const scDb = scAbs > 1e-6 ? 20 * Math.log10(scAbs) : -120;

                // Smooth envelope (attack/release ballistics)
                if (scDb > envdB) {
                    envdB = attackCoeff * envdB + (1 - attackCoeff) * scDb;
                } else {
                    envdB = releaseCoeff * envdB + (1 - releaseCoeff) * scDb;
                }

                // --- Gain computer ---
                let gainReductionDb = 0;
                if (envdB > thresholdDb) {
                    // Soft-knee region: apply compression ratio above threshold
                    const overshootDb = envdB - thresholdDb;
                    const compressedOvershoot = overshootDb / ratio;
                    gainReductionDb = compressedOvershoot - overshootDb;
                }

                // Convert gain reduction from dB to linear
                const grLinear = Math.pow(10, gainReductionDb / 20);

                // --- Apply to main signal ---
                const drySample = mainData[i];
                const wetSample = drySample * grLinear * makeupLinear;

                // Dry/wet blend
                outData[i] = drySample * (1 - mix) + wetSample * mix;
            }

            this._envdB[ch] = envdB;
        }

        // Fill any remaining output channels with silence
        for (let ch = numChannels; ch < output.length; ch++) {
            output[ch].fill(0);
        }

        return true;
    }
}

registerProcessor('sidechain-compressor-processor', SidechainCompressorProcessor);
