export const AUDIO_ASSET_EXTENSIONS = [
  'wav',
  'mp3',
  'ogg',
  'oga',
  'opus',
  'flac',
  'aif',
  'aiff',
  'webm',
  'm4a',
  'mp4',
  'aac',
  'bin',
] as const;

export type AudioAssetExtension = (typeof AUDIO_ASSET_EXTENSIONS)[number];

export interface AudioAssetFormat {
  extension: AudioAssetExtension;
  contentType: string;
}

const MIME_FORMATS: Record<string, AudioAssetFormat> = {
  'audio/wav': { extension: 'wav', contentType: 'audio/wav' },
  'audio/x-wav': { extension: 'wav', contentType: 'audio/wav' },
  'audio/mpeg': { extension: 'mp3', contentType: 'audio/mpeg' },
  'audio/mp3': { extension: 'mp3', contentType: 'audio/mpeg' },
  'audio/ogg': { extension: 'ogg', contentType: 'audio/ogg' },
  'application/ogg': { extension: 'ogg', contentType: 'audio/ogg' },
  'audio/opus': { extension: 'opus', contentType: 'audio/opus' },
  'audio/flac': { extension: 'flac', contentType: 'audio/flac' },
  'audio/x-flac': { extension: 'flac', contentType: 'audio/flac' },
  'audio/aiff': { extension: 'aiff', contentType: 'audio/aiff' },
  'audio/x-aiff': { extension: 'aiff', contentType: 'audio/aiff' },
  'audio/webm': { extension: 'webm', contentType: 'audio/webm' },
  'audio/mp4': { extension: 'm4a', contentType: 'audio/mp4' },
  'audio/x-m4a': { extension: 'm4a', contentType: 'audio/mp4' },
  'audio/aac': { extension: 'aac', contentType: 'audio/aac' },
};

const EXTENSION_CONTENT_TYPES: Record<AudioAssetExtension, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/opus',
  flac: 'audio/flac',
  aif: 'audio/aiff',
  aiff: 'audio/aiff',
  webm: 'audio/webm',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  bin: 'application/octet-stream',
};

function extensionFromFileName(fileName?: string): AudioAssetExtension | null {
  const rawExtension = fileName?.trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (!rawExtension) return null;
  return AUDIO_ASSET_EXTENSIONS.includes(rawExtension as AudioAssetExtension)
    ? rawExtension as AudioAssetExtension
    : null;
}

export function resolveAudioAssetFormat(blob: Blob, fileName?: string): AudioAssetFormat {
  const normalizedMime = blob.type.trim().toLowerCase().split(';', 1)[0];
  const mimeFormat = MIME_FORMATS[normalizedMime];
  if (mimeFormat) return mimeFormat;

  const extension = extensionFromFileName(fileName) ?? 'bin';
  return {
    extension,
    contentType: EXTENSION_CONTENT_TYPES[extension],
  };
}
