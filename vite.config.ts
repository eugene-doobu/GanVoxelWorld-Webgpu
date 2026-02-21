import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * Vite plugin: WGSL #include preprocessor.
 * Replaces `#include "common/file.wgsl"` directives with the file contents.
 * Supports nested includes with cycle detection.
 */
function wgslInclude(): Plugin {
  const includeRegex = /^#include\s+"([^"]+)"\s*$/gm;

  function processIncludes(code: string, filePath: string, seen: Set<string>): string {
    return code.replace(includeRegex, (_match, includePath: string) => {
      const resolvedPath = resolve(dirname(filePath), includePath);
      if (seen.has(resolvedPath)) {
        throw new Error(`Circular #include detected: ${resolvedPath}`);
      }
      seen.add(resolvedPath);
      const content = readFileSync(resolvedPath, 'utf-8');
      return processIncludes(content, resolvedPath, seen);
    });
  }

  return {
    name: 'wgsl-include',
    enforce: 'pre',
    transform(code, id) {
      // Strip query params (e.g. ?raw) for path matching
      const cleanId = id.replace(/\?.*$/, '');
      if (!cleanId.endsWith('.wgsl')) return;
      if (!code.includes('#include')) return;
      const processed = processIncludes(code, cleanId, new Set([cleanId]));
      return { code: processed, map: null };
    },
    handleHotUpdate({ file, server }) {
      // When a common include file changes, invalidate all .wgsl modules
      if (file.endsWith('.wgsl') && file.includes('common')) {
        const mods = [...server.moduleGraph.idToModuleMap.values()]
          .filter(m => m.file?.endsWith('.wgsl'));
        for (const mod of mods) {
          server.moduleGraph.invalidateModule(mod);
        }
        return [];
      }
    },
  };
}

export default defineConfig({
  plugins: [wgslInclude()],
  build: {
    target: 'esnext',
  },
  assetsInclude: ['**/*.wgsl'],
});
