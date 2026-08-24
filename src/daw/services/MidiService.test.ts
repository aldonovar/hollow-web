import assert from 'node:assert/strict';
import test from 'node:test';

import { isExpectedMidiAccessDenial } from './MidiService.ts';

test('treats browser MIDI permission denials as an expected optional-device state', () => {
  assert.equal(isExpectedMidiAccessDenial({ name: 'NotAllowedError' }), true);
  assert.equal(isExpectedMidiAccessDenial({ name: 'SecurityError' }), true);
  assert.equal(isExpectedMidiAccessDenial({ name: 'InvalidStateError' }), false);
  assert.equal(isExpectedMidiAccessDenial(new Error('hardware failure')), false);
});
