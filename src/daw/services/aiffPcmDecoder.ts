export const AIFF_PCM_LIMITS = Object.freeze({
    maxInputBytes: 512 * 1024 * 1024,
    maxChannels: 32,
    maxDecodedSamples: 128 * 1024 * 1024,
    minSampleRate: 3_000,
    maxSampleRate: 192_000
});

export type AiffPcmDecodeErrorCode =
    | 'NOT_AIFF'
    | 'MALFORMED'
    | 'UNSUPPORTED'
    | 'LIMIT_EXCEEDED';

export class AiffPcmDecodeError extends Error {
    readonly code: AiffPcmDecodeErrorCode;

    constructor(
        message: string,
        code: AiffPcmDecodeErrorCode
    ) {
        super(message);
        this.name = 'AiffPcmDecodeError';
        this.code = code;
    }
}

export interface DecodedAiffPcm {
    sampleRate: number;
    numberOfChannels: number;
    length: number;
    duration: number;
    channelData: Float32Array[];
}

interface AiffCommonChunk {
    numberOfChannels: number;
    numberOfFrames: number;
    sampleSize: 8 | 16 | 24 | 32;
    sampleRate: number;
    littleEndian: boolean;
}

interface AiffSoundChunk {
    sampleStart: number;
    sampleEnd: number;
}

const readFourCc = (bytes: Uint8Array, offset: number): string =>
    String.fromCharCode(
        bytes[offset] ?? 0,
        bytes[offset + 1] ?? 0,
        bytes[offset + 2] ?? 0,
        bytes[offset + 3] ?? 0
    );

const fail = (message: string, code: AiffPcmDecodeErrorCode = 'MALFORMED'): never => {
    throw new AiffPcmDecodeError(message, code);
};

const readExtended80 = (view: DataView, offset: number): number => {
    const signAndExponent = view.getUint16(offset, false);
    const sign = (signAndExponent & 0x8000) !== 0;
    const exponent = signAndExponent & 0x7fff;
    const mantissaHigh = view.getUint32(offset + 2, false);
    const mantissaLow = view.getUint32(offset + 6, false);

    if (sign || exponent === 0x7fff) {
        return Number.NaN;
    }

    if (exponent === 0 && mantissaHigh === 0 && mantissaLow === 0) {
        return 0;
    }

    const mantissa = (mantissaHigh * 0x1_0000_0000) + mantissaLow;
    return mantissa * (2 ** (exponent - 16383 - 63));
};

const parseCommonChunk = (
    bytes: Uint8Array,
    view: DataView,
    dataStart: number,
    chunkSize: number,
    formType: 'AIFF' | 'AIFC'
): AiffCommonChunk => {
    if (chunkSize < 18) {
        return fail('AIFF COMM chunk is truncated.');
    }

    const numberOfChannels = view.getUint16(dataStart, false);
    const numberOfFrames = view.getUint32(dataStart + 2, false);
    const rawSampleSize = view.getUint16(dataStart + 6, false);
    const sampleRate = readExtended80(view, dataStart + 8);

    if (numberOfChannels < 1 || numberOfChannels > AIFF_PCM_LIMITS.maxChannels) {
        return fail('AIFF channel count exceeds the safe decoder limit.', 'LIMIT_EXCEEDED');
    }

    if (numberOfFrames < 1) {
        return fail('AIFF contains no audio frames.');
    }

    if (![8, 16, 24, 32].includes(rawSampleSize)) {
        return fail(`AIFF PCM sample size ${rawSampleSize} is not supported.`, 'UNSUPPORTED');
    }

    if (
        !Number.isFinite(sampleRate)
        || sampleRate < AIFF_PCM_LIMITS.minSampleRate
        || sampleRate > AIFF_PCM_LIMITS.maxSampleRate
    ) {
        return fail('AIFF sample rate is invalid or exceeds the safe decoder limit.', 'LIMIT_EXCEEDED');
    }

    const decodedSamples = numberOfChannels * numberOfFrames;
    if (!Number.isSafeInteger(decodedSamples) || decodedSamples > AIFF_PCM_LIMITS.maxDecodedSamples) {
        return fail('AIFF decoded sample count exceeds the safe memory limit.', 'LIMIT_EXCEEDED');
    }

    let littleEndian = false;
    if (formType === 'AIFC') {
        if (chunkSize < 22) {
            return fail('AIFC COMM chunk is missing its compression type.');
        }

        const compressionType = readFourCc(bytes, dataStart + 18);
        if (compressionType === 'sowt') {
            littleEndian = true;
        } else if (compressionType !== 'NONE') {
            return fail(`AIFC compression '${compressionType}' is not supported.`, 'UNSUPPORTED');
        }
    }

    return {
        numberOfChannels,
        numberOfFrames,
        sampleSize: rawSampleSize as 8 | 16 | 24 | 32,
        sampleRate: Math.round(sampleRate),
        littleEndian
    };
};

export const isAiffPcmContainer = (arrayBuffer: ArrayBuffer): boolean => {
    if (arrayBuffer.byteLength < 12) return false;
    const bytes = new Uint8Array(arrayBuffer, 0, 12);
    const formType = readFourCc(bytes, 8);
    return readFourCc(bytes, 0) === 'FORM' && (formType === 'AIFF' || formType === 'AIFC');
};

export const decodeAiffPcm = (arrayBuffer: ArrayBuffer): DecodedAiffPcm => {
    if (arrayBuffer.byteLength > AIFF_PCM_LIMITS.maxInputBytes) {
        return fail('AIFF input exceeds the safe decoder size limit.', 'LIMIT_EXCEEDED');
    }

    if (!isAiffPcmContainer(arrayBuffer)) {
        return fail('Input is not an AIFF or AIFC container.', 'NOT_AIFF');
    }

    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const formType = readFourCc(bytes, 8) as 'AIFF' | 'AIFC';
    const formSize = view.getUint32(4, false);
    const formEnd = 8 + formSize;

    if (formSize < 4 || formEnd > bytes.byteLength) {
        return fail('AIFF FORM size extends beyond the available input.');
    }

    let common: AiffCommonChunk | null = null;
    let sound: AiffSoundChunk | null = null;
    let cursor = 12;

    while (cursor < formEnd) {
        if (cursor + 8 > formEnd) {
            return fail('AIFF contains a truncated chunk header.');
        }

        const chunkId = readFourCc(bytes, cursor);
        const chunkSize = view.getUint32(cursor + 4, false);
        const dataStart = cursor + 8;
        const dataEnd = dataStart + chunkSize;
        const nextChunk = dataEnd + (chunkSize & 1);

        if (!Number.isSafeInteger(dataEnd) || dataEnd > formEnd || nextChunk > formEnd) {
            return fail(`AIFF chunk '${chunkId}' extends beyond the FORM boundary.`);
        }

        if (chunkId === 'COMM') {
            if (common) return fail('AIFF contains duplicate COMM chunks.');
            common = parseCommonChunk(bytes, view, dataStart, chunkSize, formType);
        } else if (chunkId === 'SSND') {
            if (sound) return fail('AIFF contains duplicate SSND chunks.');
            if (chunkSize < 8) return fail('AIFF SSND chunk is truncated.');

            const offset = view.getUint32(dataStart, false);
            const payloadStart = dataStart + 8;
            const sampleStart = payloadStart + offset;
            if (sampleStart > dataEnd) {
                return fail('AIFF SSND offset extends beyond its chunk.');
            }
            sound = { sampleStart, sampleEnd: dataEnd };
        }

        cursor = nextChunk;
    }

    if (!common) return fail('AIFF is missing its COMM chunk.');
    if (!sound) return fail('AIFF is missing its SSND chunk.');

    const bytesPerSample = common.sampleSize / 8;
    const expectedSampleBytes = common.numberOfFrames * common.numberOfChannels * bytesPerSample;
    if (expectedSampleBytes > sound.sampleEnd - sound.sampleStart) {
        return fail('AIFF SSND sample payload is shorter than declared by COMM.');
    }

    const channelData = Array.from(
        { length: common.numberOfChannels },
        () => new Float32Array(common.numberOfFrames)
    );
    let sampleOffset = sound.sampleStart;

    for (let frame = 0; frame < common.numberOfFrames; frame += 1) {
        for (let channel = 0; channel < common.numberOfChannels; channel += 1) {
            let value: number;
            switch (common.sampleSize) {
                case 8:
                    value = view.getInt8(sampleOffset) / 128;
                    break;
                case 16:
                    value = view.getInt16(sampleOffset, common.littleEndian) / 32768;
                    break;
                case 24: {
                    const first = bytes[sampleOffset] ?? 0;
                    const second = bytes[sampleOffset + 1] ?? 0;
                    const third = bytes[sampleOffset + 2] ?? 0;
                    const unsigned = common.littleEndian
                        ? first | (second << 8) | (third << 16)
                        : (first << 16) | (second << 8) | third;
                    const signed = (unsigned & 0x800000) !== 0 ? unsigned - 0x1000000 : unsigned;
                    value = signed / 8388608;
                    break;
                }
                case 32:
                    value = view.getInt32(sampleOffset, common.littleEndian) / 2147483648;
                    break;
            }

            channelData[channel][frame] = value;
            sampleOffset += bytesPerSample;
        }
    }

    return {
        sampleRate: common.sampleRate,
        numberOfChannels: common.numberOfChannels,
        length: common.numberOfFrames,
        duration: common.numberOfFrames / common.sampleRate,
        channelData
    };
};
