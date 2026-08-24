import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUDIO_IMPORT_ACCEPT,
  AUDIO_IMPORT_EXTENSIONS,
  describeAudioImportFormats,
  isSupportedAudioImportName,
} from './audioImportContract.ts';

test('web audio picker exposes the complete supported import contract', () => {
  for (const extension of AUDIO_IMPORT_EXTENSIONS) {
    assert.equal(isSupportedAudioImportName(`track.${extension.toUpperCase()}`), true);
    assert.ok(AUDIO_IMPORT_ACCEPT.includes(`.${extension}`));
  }

  assert.equal(isSupportedAudioImportName('project.esp'), false);
  assert.match(describeAudioImportFormats(), /M4A\/AAC/);
});
