// MegaBuffer: single large GPU buffer for all chunk vertex/index data.
// Uses a free-list allocator for sub-region allocation and deallocation.

export interface MegaAllocation {
  offset: number;    // byte offset within the mega buffer
  size: number;      // size in bytes
}

// Free-list entry
interface FreeBlock {
  offset: number;
  size: number;
}

export class MegaBuffer {
  readonly buffer: GPUBuffer;
  readonly capacity: number;
  private freeList: FreeBlock[] = [];
  private device: GPUDevice;

  constructor(device: GPUDevice, capacity: number, usage: GPUBufferUsageFlags) {
    this.device = device;
    this.capacity = capacity;
    this.buffer = device.createBuffer({
      size: capacity,
      usage: usage | GPUBufferUsage.COPY_DST,
    });
    this.freeList.push({ offset: 0, size: capacity });
  }

  // Allocate a sub-region. Returns null if no contiguous space is available.
  allocate(size: number): MegaAllocation | null {
    if (size === 0) return null;

    // Align to 4 bytes (GPU requirement)
    const alignedSize = (size + 3) & ~3;

    // First-fit strategy
    for (let i = 0; i < this.freeList.length; i++) {
      const block = this.freeList[i];
      if (block.size >= alignedSize) {
        const alloc: MegaAllocation = { offset: block.offset, size: alignedSize };

        if (block.size === alignedSize) {
          this.freeList.splice(i, 1);
        } else {
          block.offset += alignedSize;
          block.size -= alignedSize;
        }

        return alloc;
      }
    }

    return null;
  }

  // Free a previously allocated sub-region.
  free(alloc: MegaAllocation): void {
    const newBlock: FreeBlock = { offset: alloc.offset, size: alloc.size };

    // Insert in sorted order by offset
    let insertIdx = this.freeList.length;
    for (let i = 0; i < this.freeList.length; i++) {
      if (this.freeList[i].offset > newBlock.offset) {
        insertIdx = i;
        break;
      }
    }
    this.freeList.splice(insertIdx, 0, newBlock);

    // Merge with adjacent blocks
    this.mergeAdjacent(insertIdx);
  }

  // Write data to a sub-region of the mega buffer.
  write(alloc: MegaAllocation, data: ArrayBuffer): void {
    this.device.queue.writeBuffer(this.buffer, alloc.offset, data);
  }

  private mergeAdjacent(idx: number): void {
    // Merge with next block
    if (idx < this.freeList.length - 1) {
      const curr = this.freeList[idx];
      const next = this.freeList[idx + 1];
      if (curr.offset + curr.size === next.offset) {
        curr.size += next.size;
        this.freeList.splice(idx + 1, 1);
      }
    }

    // Merge with previous block
    if (idx > 0) {
      const prev = this.freeList[idx - 1];
      const curr = this.freeList[idx];
      if (prev.offset + prev.size === curr.offset) {
        prev.size += curr.size;
        this.freeList.splice(idx, 1);
      }
    }
  }

  destroy(): void {
    this.buffer.destroy();
  }
}
