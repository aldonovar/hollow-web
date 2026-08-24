# Basic Pitch model assets

These files are copied verbatim from the installed npm package
`@spotify/basic-pitch@1.0.1`:

- `node_modules/@spotify/basic-pitch/model/model.json`
- `node_modules/@spotify/basic-pitch/model/group1-shard1of1.bin`
- `node_modules/@spotify/basic-pitch/LICENSE`

The package declares the Apache License 2.0. Its license text is redistributed
beside the model as `LICENSE`.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `model.json` | 174537 | `1ed1aaee3409ec1dc098c8b01f430c0911f6fe9412e7af8086750f9e8f302f68` |
| `group1-shard1of1.bin` | 742392 | `b142a95737a52e1e412d5f92e73d8bb80dfe8d04941acc0702f11f4524fb377c` |

The automated integrity check in `scripts/verify-basic-pitch-model.mjs`
validates these sizes and hashes as well as the TensorFlow.js weights manifest.
