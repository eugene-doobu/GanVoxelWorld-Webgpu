# Chunk Sub-Block Compression

## Overview

Chunks are compressed after meshing to reduce memory usage. The scheme exploits the
observation that large regions of a voxel chunk are *uniform* (all one block type -- typically AIR or STONE).

## Data Layout

Each chunk (16 x 128 x 16 blocks) is partitioned into **4x4x4 sub-blocks**, yielding a grid
of 4 x 32 x 4 = **512 sub-blocks**. Each sub-block covers 64 blocks.

### Compressed State

| Array | Size | Description |
|-------|------|-------------|
| `uniformFlags` | Uint8Array(512) | 1 = uniform sub-block, 0 = mixed |
| `uniformTypes` | Uint16Array(512) | Block type when uniform (type + meta packed) |
| `detailOffsets` | Uint16Array(512) | Index into `detailBlocks` for mixed sub-blocks (in 64-entry units) |
| `detailBlocks` | Uint16Array(mixedCount * 64) | Flat storage for all mixed sub-blocks |

The full `blocks` Uint16Array (32768 entries = 64 KB) is released after compression.

## Compression Algorithm

1. **First pass** -- iterate all 512 sub-blocks. For each, compare all 64 blocks to the
   first block. If all match, mark as uniform and record the type. Otherwise, assign a
   sequential detail offset and increment the mixed counter.

2. **Second pass** -- allocate `detailBlocks` with exactly `mixedCount * 64` entries. Copy
   block data from the full array into the detail storage for each mixed sub-block.

3. **Release** the original `blocks` array (set to empty Uint16Array).

## Block Access (Compressed)

`getBlock(x, y, z)` computes the sub-block index via integer division (`x >> 2`, etc.):

- If `uniformFlags[subIdx]` is set, return `uniformTypes[subIdx]`.
- Otherwise, compute the local offset within the 4x4x4 sub-block and index into
  `detailBlocks` at `detailOffsets[subIdx] * 64 + localIdx`.

## Decompression

`setBlock()` after compression triggers `decompress()`, which reconstructs the full
`blocks` array from uniform types and detail data. Block writes are rare after initial
terrain generation, so this path is infrequent.

## Memory Savings

For a typical chunk where ~70-80% of sub-blocks are uniform (solid stone below surface, air
above), compression reduces per-chunk memory from 64 KB to roughly:

- Metadata: 512 * (1 + 2 + 2) = 2.5 KB (flags + types + offsets)
- Detail: ~100-150 mixed sub-blocks * 128 bytes = 12-19 KB
- **Total: ~15-22 KB** (65-75% reduction)
