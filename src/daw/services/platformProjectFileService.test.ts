import assert from 'node:assert/strict';
import test from 'node:test';

test('web project APIs open and download the original Blob without text coercion', async () => {
  const sourceBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xff]);
  const sourceFile = new Blob([sourceBytes], { type: 'application/zip' }) as Blob & { name: string };
  Object.defineProperty(sourceFile, 'name', { value: 'portable.esp' });

  let downloadedBlob: Blob | null = null;
  let clickedDownload = '';
  let acceptedTypes = '';
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;

  const fakeWindow = {
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  const fakeDocument = {
    body: { appendChild: () => undefined },
    createElement: (tag: string) => {
      if (tag === 'input') {
        const input = {
          type: '',
          accept: '',
          onchange: null as ((event: Event) => void) | null,
          click() {
            acceptedTypes = this.accept;
            this.onchange?.({ target: { files: [sourceFile] } } as unknown as Event);
          },
        };
        return input;
      }
      return {
        href: '',
        download: '',
        rel: '',
        style: { display: '' },
        click() { clickedDownload = this.download; },
        remove: () => undefined,
      };
    },
  };

  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: fakeDocument });
  URL.createObjectURL = (blob: Blob) => {
    downloadedBlob = blob;
    return 'blob:portable-project';
  };
  URL.revokeObjectURL = () => undefined;

  try {
    const { platformService } = await import('./platformService.ts');
    const opened = await platformService.openProjectBlob();
    assert.ok(opened);
    assert.equal(opened.filename, 'portable.esp');
    assert.equal(opened.blob, sourceFile);
    assert.match(acceptedTypes, /application\/zip/);
    assert.deepEqual(new Uint8Array(await opened.blob.arrayBuffer()), sourceBytes);

    const saved = await platformService.saveProjectBlob(sourceFile, 'My / Mix');
    assert.equal(saved.success, true);
    assert.equal(saved.filePath, 'My  Mix');
    assert.equal(clickedDownload, 'My  Mix.esp');
    assert.equal(downloadedBlob, sourceFile);
    await new Promise((resolve) => setTimeout(resolve, 1));
  } finally {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
  }
});
