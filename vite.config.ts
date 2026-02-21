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
    load(id) {
      const cleanId = id.replace(/\?.*$/, '');
      if (!cleanId.endsWith('.wgsl')) return;

      let code: string;
      try {
        code = readFileSync(cleanId, 'utf-8');
      } catch {
        return;
      }

      if (code.includes('#include')) {
        code = processIncludes(code, cleanId, new Set([cleanId]));
      }

      // For ?raw imports, return as JS string export directly
      // This prevents Vite's built-in raw handler from returning unprocessed content
      if (id.includes('?')) {
        return `export default ${JSON.stringify(code)}`;
      }

      return code;
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
