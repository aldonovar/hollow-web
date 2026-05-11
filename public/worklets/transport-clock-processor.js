/**
 * HOLLOW BITS — Transport Clock AudioWorklet Processor
 *
 * Provides a high-precision clock source for the transport scheduler.
 * Runs on the audio thread with sample-accurate timing, avoiding the
 * jitter inherent in setInterval/setTimeout on the main thread.
 *
 * Sends periodic tick messages to the main thread via the MessagePort.
 * The main thread uses these ticks to drive lookahead scheduling.
 */
class TransportClockProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._tickInterval = 128; // samples between ticks (at 48kHz ≈ 2.67ms)
        this._sampleCounter = 0;
        this._isRunning = true;

        this.port.onmessage = (event) => {
            if (event.data.type === 'setTickInterval') {
                this._tickInterval = Math.max(64, Math.min(4096, event.data.interval));
            } else if (event.data.type === 'stop') {
                this._isRunning = false;
            } else if (event.data.type === 'start') {
                this._isRunning = true;
            }
        };
    }

    process(inputs, outputs, parameters) {
        if (!this._isRunning) return true;

        const blockSize = 128; // standard render quantum
        this._sampleCounter += blockSize;

        if (this._sampleCounter >= this._tickInterval) {
            this._sampleCounter -= this._tickInterval;
            this.port.postMessage({
                type: 'tick',
                currentTime: currentTime,
                currentFrame: currentFrame
            });
        }

        return true;
    }
}

registerProcessor('transport-clock-processor', TransportClockProcessor);
