import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetDirectory = path.join(repositoryRoot, 'public', 'models', 'basic-pitch');
const dependencyDirectory = path.join(repositoryRoot, 'node_modules', '@spotify', 'basic-pitch');

const expectedAssets = new Map([
    ['model.json', {
        bytes: 174537,
        sha256: '1ed1aaee3409ec1dc098c8b01f430c0911f6fe9412e7af8086750f9e8f302f68'
    }],
    ['group1-shard1of1.bin', {
        bytes: 742392,
        sha256: 'b142a95737a52e1e412d5f92e73d8bb80dfe8d04941acc0702f11f4524fb377c'
    }]
]);

const inspectFile = async (filePath) => {
    const fileStat = await stat(filePath);
    assert.equal(fileStat.isFile(), true, `${filePath} must be a regular file`);
    assert.ok(fileStat.size > 0, `${filePath} must not be empty`);

    const bytes = await readFile(filePath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    assert.equal(sha256.length, 64, `${filePath} must produce a complete SHA-256 digest`);

    return { bytes, size: fileStat.size, sha256 };
};

const inspectExpectedAsset = async (fileName) => {
    const expected = expectedAssets.get(fileName);
    assert.ok(expected, `No integrity baseline exists for ${fileName}`);

    const target = await inspectFile(path.join(assetDirectory, fileName));
    assert.equal(target.size, expected.bytes, `${fileName} has an unexpected size`);
    assert.equal(target.sha256, expected.sha256, `${fileName} failed its SHA-256 integrity check`);

    const source = await inspectFile(path.join(dependencyDirectory, 'model', fileName));
    assert.equal(source.size, target.size, `${fileName} differs in size from the installed dependency`);
    assert.equal(source.sha256, target.sha256, `${fileName} is not a verbatim dependency asset`);

    return { fileName, size: target.size, sha256: target.sha256 };
};

const packageMetadata = JSON.parse(await readFile(path.join(dependencyDirectory, 'package.json'), 'utf8'));
assert.equal(packageMetadata.name, '@spotify/basic-pitch');
assert.equal(packageMetadata.version, '1.0.1');
assert.equal(packageMetadata.license, 'Apache-2.0');

const license = await inspectFile(path.join(assetDirectory, 'LICENSE'));
const licenseText = license.bytes.toString('utf8');
assert.match(licenseText, /Apache License\s+Version 2\.0, January 2004/);

const sourceLicense = await inspectFile(path.join(dependencyDirectory, 'LICENSE'));
assert.equal(license.sha256, sourceLicense.sha256, 'The redistributed LICENSE must match the dependency');

const modelAsset = await inspectExpectedAsset('model.json');
const model = JSON.parse((await readFile(path.join(assetDirectory, 'model.json'))).toString('utf8'));
assert.equal(model.format, 'graph-model', 'model.json must describe a TensorFlow.js graph model');
assert.ok(Array.isArray(model.weightsManifest), 'model.json must expose a weightsManifest array');
assert.ok(model.weightsManifest.length > 0, 'weightsManifest must not be empty');

const manifestPaths = model.weightsManifest.flatMap((group) => {
    assert.ok(group && typeof group === 'object', 'Each weightsManifest entry must be an object');
    assert.ok(Array.isArray(group.paths) && group.paths.length > 0, 'Each manifest group must reference at least one shard');
    assert.ok(Array.isArray(group.weights) && group.weights.length > 0, 'Each manifest group must describe at least one weight');
    return group.paths;
});

assert.deepEqual(manifestPaths, ['group1-shard1of1.bin'], 'The model must reference the bundled Basic Pitch shard');

const shards = [];
for (const manifestPath of manifestPaths) {
    assert.equal(typeof manifestPath, 'string', 'Manifest shard paths must be strings');
    assert.ok(manifestPath.length > 0, 'Manifest shard paths must not be empty');
    assert.equal(path.isAbsolute(manifestPath), false, 'Manifest shard paths must be relative');

    const resolvedShard = path.resolve(assetDirectory, manifestPath);
    assert.ok(
        resolvedShard.startsWith(`${assetDirectory}${path.sep}`),
        `Manifest shard path escapes the model directory: ${manifestPath}`
    );
    shards.push(await inspectExpectedAsset(manifestPath));
}

console.log(JSON.stringify({
    status: 'PASS',
    package: `${packageMetadata.name}@${packageMetadata.version}`,
    license: packageMetadata.license,
    model: modelAsset,
    shards
}, null, 2));
