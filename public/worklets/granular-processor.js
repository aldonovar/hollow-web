/**
 * HOLLOW BITS — Granular Synthesis AudioWorklet Processor
 *
 * Provides independent pitch and time manipulation via granular synthesis.
 * Receives stereo buffer data via MessagePort, then reads grains from that
 * buffer at the requested playback rate while resampling each grain by a
 * pitch multiplier.
 *
 * AudioParam controls (k-rate):
 *   isPlaying    — gate (0 = off, 1 = playing)
 *   playbackRate — time-stretch ratio (1 = original speed)
 *   pitch        — pitch multiplier (1 = original pitch, 2 = octave up)
 *   startOffset  — position in seconds to begin reading from the buffer
 *   grainSize    — grain window size in seconds (default 0.06)
 *   overlap      — number of overlapping grains (default 4)
 */
class GranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._buffer = null;       // [Float32Array, Float32Array] — L/R
        this._bufferLength = 0;
        this._readPosition = 0;    // Current read position in samples
        this._grainPhases = [];    // Active grain phases
        this._numGrains = 4;
        this._playing = false;

        this.port.onmessage = (event) => {
            if (event.data.type === 'loadBuffer') {
                const [ch0, ch1] = event.data.buffer;
                this._buffer = [new Float32Array(ch0), new Float32Array(ch1)];
                this._bufferLength = ch0.length;
                this._readPosition = 0;
                this._initGrains();
            }
        };
    }

    static get parameterDescriptors() {
        return [
            { name: 'isPlaying',    defaultValue: 0, minValue: 0, maxValue: 1,    automationRate: 'k-rate' },
            { name: 'playbackRate', defaultValue: 1, minValue: 0.05, maxValue: 8, automationRate: 'k-rate' },
            { name: 'pitch',        defaultValue: 1, minValue: 0.25, maxValue: 4, automationRate: 'k-rate' },
            { name: 'startOffset',  defaultValue: 0, minValue: 0, maxValue: 3600, automationRate: 'k-rate' },
            { name: 'grainSize',    defaultValue: 0.06, minValue: 0.01, maxValue: 0.5, automationRate: 'k-rate' },
            { name: 'overlap',      defaultValue: 4, minValue: 1, maxValue: 8,    automationRate: 'k-rate' },
        ];
    }

    _initGrains() {
        this._grainPhases = [];
        for (let i = 0; i < this._numGrains; i++) {
            this._grainPhases.push({
                phase: i / this._numGrains,  // Stagger grains evenly
                active: true
            });
        }
    }

    /**
     * Hann window function for smooth grain envelopes
     */
    _hannWindow(phase) {
        return 0.5 * (1 - Math.cos(2 * Math.PI * phase));
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || output.length === 0) return true;
        if (!this._buffer || this._bufferLength === 0) {
            // No buffer loaded — output silence
            for (let ch = 0; ch < output.length; ch++) {
                output[ch].fill(0);
            }
            return true;
        }

        const isPlaying    = parameters.isPlaying[0] > 0.5;
        const playbackRate = Math.max(0.05, parameters.playbackRate[0]);
        const pitch        = Math.max(0.25, parameters.pitch[0]);
        const startOffset  = Math.max(0, parameters.startOffset[0]) * sampleRate;
        const grainSizeSec = parameters.grainSize[0];
        const grainSizeSamples = Math.max(128, Math.floor(grainSizeSec * sampleRate));
        const numGrains    = Math.max(1, Math.min(8, Math.floor(parameters.overlap[0])));
        const blockSize    = output[0].length;

        // If not playing, output silence
        if (!isPlaying) {
            for (let ch = 0; ch < output.length; ch++) {
                output[ch].fill(0);
            }
            return true;
        }

        // Ensure correct number of grains
        if (this._grainPhases.length !== numGrains) {
            this._numGrains = numGrains;
            this._initGrains();
        }

        // Initialize read position from startOffset if it was just set
        if (this._readPosition === 0 && startOffset > 0) {
            this._readPosition = startOffset;
        }

        const outL = output[0];
        const outR = output.length > 1 ? output[1] : null;
        outL.fill(0);
        if (outR) outR.fill(0);

        const advancePerSample = playbackRate;
        const grainAdvancePerSample = pitch;
        const hopSize = grainSizeSamples / numGrains;

        for (let i = 0; i < blockSize; i++) {
            let sumL = 0;
            let sumR = 0;

            for (let g = 0; g < numGrains; g++) {
                const grain = this._grainPhases[g];
                const grainPosition = grain.phase * grainSizeSamples;
                
                // Compute the actual sample position in the buffer
                const bufferPos = this._readPosition + grainPosition * grainAdvancePerSample - g * hopSize * grainAdvancePerSample;
                const sampleIdx = Math.floor(bufferPos) % this._bufferLength;
                const safeSampleIdx = ((sampleIdx % this._bufferLength) + this._bufferLength) % this._bufferLength;

                // Hann window envelope
                const envelope = this._hannWindow(grain.phase);

                sumL += this._buffer[0][safeSampleIdx] * envelope;
                sumR += this._buffer[1][safeSampleIdx] * envelope;

                // Advance grain phase
                grain.phase += grainAdvancePerSample / grainSizeSamples;
                if (grain.phase >= 1) {
                    grain.phase -= 1;
                }
            }

            // Normalize by number of overlapping grains
            const normFactor = 1 / Math.sqrt(numGrains);
            outL[i] = sumL * normFactor;
            if (outR) outR[i] = sumR * normFactor;

            // Advance read position
            this._readPosition += advancePerSample;
            if (this._readPosition >= this._bufferLength) {
                this._readPosition = 0;
            }
        }

        return true;
    }
}

registerProcessor('granular-processor', GranularProcessor);
