import assert from 'node:assert/strict';
import test from 'node:test';
import {
    AIFF_PCM_LIMITS,
    AiffPcmDecodeError,
    decodeAiffPcm,
    isAiffPcmContainer
} from './aiffPcmDecoder.ts';

const writeFourCc = (bytes: Uint8Array, offset: number, value: string) => {
    for (let index = 0; index < 4; index += 1) {
        bytes[offset + index] = value.charCodeAt(index);
    }
};

const sampleRate80 = (sampleRate: 44_100 | 48_000): Uint8Array => sampleRate === 44_100
    ? Uint8Array.of(0x40, 0x0e, 0xac, 0x44, 0, 0, 0, 0, 0, 0)
    : Uint8Array.of(0x40, 0x0e, 0xbb, 0x80, 0, 0, 0, 0, 0, 0);

interface FixtureOptions {
    channels?: number;
    frames?: number;
    sampleSize?: 16 | 24;
    sampleRate?: 44_100 | 48_000;
    formType?: 'AIFF' | 'AIFC';
    compressionType?: 'NONE' | 'sowt';
    samples?: number[];
}

const createFixture = ({
    channels = 2,
    frames = 2,
    sampleSize = 16,
    sampleRate = 48_000,
    formType = 'AIFF',
    compressionType = 'NONE',
    samples = [-32768, 32767, 0, -16384]
}: FixtureOptions = {}): ArrayBuffer => {
    const commonSize = formType === 'AIFC' ? 22 : 18;
    const bytesPerSample = sampleSize / 8;
    const sampleBytes = frames * channels * bytesPerSample;
    const commonTotal = 8 + commonSize;
    const soundSize = 8 + sampleBytes;
    const soundTotal = 8 + soundSize + (soundSize & 1);
    const formSize = 4 + commonTotal + soundTotal;
    const bytes = new Uint8Array(8 + formSize);
    const view = new DataView(bytes.buffer);

    writeFourCc(bytes, 0, 'FORM');
    view.setUint32(4, formSize, false);
    writeFourCc(bytes, 8, formType);
    writeFourCc(bytes, 12, 'COMM');
    view.setUint32(16, commonSize, false);
    view.setUint16(20, channels, false);
    view.setUint32(22, frames, false);
    view.setUint16(26, sampleSize, false);
    bytes.set(sampleRate80(sampleRate), 28);
    if (formType === 'AIFC') writeFourCc(bytes, 38, compressionType);

    const soundChunk = 20 + commonSize;
    writeFourCc(bytes, soundChunk, 'SSND');
    view.setUint32(soundChunk + 4, soundSize, false);
    view.setUint32(soundChunk + 8, 0, false);
    view.setUint32(soundChunk + 12, 0, false);
    let cursor = soundChunk + 16;
    for (const rawSample of samples.slice(0, frames * channels)) {
        if (sampleSize === 16) {
            view.setInt16(cursor, rawSample, compressionType === 'sowt');
        } else {
            const normalized = rawSample < 0 ? rawSample + 0x1000000 : rawSample;
            if (compressionType === 'sowt') {
                bytes[cursor] = normalized & 0xff;
                bytes[cursor + 1] = (normalized >>> 8) & 0xff;
                bytes[cursor + 2] = (normalized >>> 16) & 0xff;
            } else {
                bytes[cursor] = (normalized >>> 16) & 0xff;
                bytes[cursor + 1] = (normalized >>> 8) & 0xff;
                bytes[cursor + 2] = normalized & 0xff;
            }
        }
        cursor += bytesPerSample;
    }

    return bytes.buffer;
};

test('decodes interleaved PCM16 big-endian AIFF into planar float channels', () => {
    const fixture = createFixture();
    assert.equal(isAiffPcmContainer(fixture), true);

    const decoded = decodeAiffPcm(fixture);
    assert.equal(decoded.sampleRate, 48_000);
    assert.equal(decoded.numberOfChannels, 2);
    assert.equal(decoded.length, 2);
    assert.deepEqual(Array.from(decoded.channelData[0]), [-1, 0]);
    assert.ok(Math.abs(decoded.channelData[1][0] - (32767 / 32768)) < 1e-7);
    assert.equal(decoded.channelData[1][1], -0.5);
});

test('decodes PCM24 big-endian used by the real Chromium-failing fixture', () => {
    const decoded = decodeAiffPcm(createFixture({
        channels: 1,
        frames: 3,
        sampleSize: 24,
        samples: [-8388608, 0, 8388607]
    }));

    assert.deepEqual(Array.from(decoded.channelData[0]).slice(0, 2), [-1, 0]);
    assert.ok(decoded.channelData[0][2] > 0.9999998);
});

test('supports uncompressed little-endian AIFC sowt PCM', () => {
    const decoded = decodeAiffPcm(createFixture({
        channels: 1,
        frames: 2,
        formType: 'AIFC',
        compressionType: 'sowt',
        samples: [16384, -16384]
    }));

    assert.deepEqual(Array.from(decoded.channelData[0]), [0.5, -0.5]);
});

test('rejects truncated chunks and invalid SSND offsets', () => {
    const truncated = createFixture().slice(0, -1);
    assert.throws(() => decodeAiffPcm(truncated), AiffPcmDecodeError);

    const invalidOffset = createFixture();
    const bytes = new Uint8Array(invalidOffset);
    const soundChunk = 38;
    new DataView(invalidOffset).setUint32(soundChunk + 8, 1_000_000, false);
    assert.throws(
        () => decodeAiffPcm(bytes.buffer),
        (error: unknown) => error instanceof AiffPcmDecodeError && error.code === 'MALFORMED'
    );
});

test('rejects declared decoded data above the safe memory limit before allocation', () => {
    const fixture = createFixture({ channels: 1, frames: 1, samples: [0] });
    new DataView(fixture).setUint32(22, AIFF_PCM_LIMITS.maxDecodedSamples + 1, false);

    assert.throws(
        () => decodeAiffPcm(fixture),
        (error: unknown) => error instanceof AiffPcmDecodeError && error.code === 'LIMIT_EXCEEDED'
    );
});
