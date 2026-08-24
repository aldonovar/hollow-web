import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  AI_GATEWAY_UNAVAILABLE,
  AiGatewayError,
  analyzeMix,
  generatePattern,
  getAiGatewayStatus,
  isAiGatewayError,
} from './aiGatewayService.ts';

test('reports a safe unavailable state without evaluating browser secrets', () => {
  assert.deepEqual(getAiGatewayStatus(), {
    available: false,
    code: AI_GATEWAY_UNAVAILABLE,
    message: 'El asistente IA requiere un gateway seguro del servidor y no esta disponible en este build.',
  });
});

test('rejects AI actions explicitly while the server gateway does not exist', async () => {
  await assert.rejects(generatePattern('private prompt', 120), {
    code: AI_GATEWAY_UNAVAILABLE,
  });
  await assert.rejects(analyzeMix([]), {
    code: AI_GATEWAY_UNAVAILABLE,
  });
  assert.equal(isAiGatewayError(new AiGatewayError()), true);
  assert.equal(isAiGatewayError(new Error('other')), false);
});

test('keeps the renderer free of the former client-side Gemini crash path', () => {
  const serviceSource = readFileSync(new URL('./aiGatewayService.ts', import.meta.url), 'utf8');
  const sidebarSource = readFileSync(new URL('../components/AISidebar.tsx', import.meta.url), 'utf8');
  const rendererSource = `${serviceSource}\n${sidebarSource}`;

  assert.doesNotMatch(rendererSource, /process\.env|GEMINI_API_KEY|GoogleGenAI|geminiService/);
  assert.match(sidebarSource, /getAiGatewayStatus/);
  assert.match(sidebarSource, /disabled=\{loading \|\| !aiGatewayStatus\.available\}/);
});
