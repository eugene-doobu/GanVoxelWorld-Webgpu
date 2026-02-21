/**
 * Check shader compilation results. Logs warnings and throws on errors.
 */
export async function checkShaderCompilation(name: string, module: GPUShaderModule): Promise<void> {
  const info = await module.getCompilationInfo();
  for (const msg of info.messages) {
    if (msg.type === 'error') {
      throw new Error(`[${name}] shader error (line ${msg.lineNum}): ${msg.message}`);
    }
    console.warn(`[${name}] ${msg.type}: ${msg.message} (line ${msg.lineNum})`);
  }
}
