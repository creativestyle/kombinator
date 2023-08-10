import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

function createNuxtConfigFile(directory: string) {
  const nuxtConfigTemplate = `// nuxt.config.ts
export default {
  export default defineNuxtConfig({})
}
`;

  const filePath = path.resolve(directory, 'nuxt.config.ts');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, nuxtConfigTemplate, 'utf8');
    console.log(`nuxt.config.ts created at: ${filePath}`);
  } else {
    console.log(`nuxt.config.ts already exists at: ${filePath}`);
  }
}

export default function NuxtConfigPlugin(directory: string): Plugin {
  return {
    name: 'vite-plugin-nuxt-config',
    apply: 'build',
    configResolved(resolvedConfig) {
      if (resolvedConfig.command === 'build') {
        createNuxtConfigFile(directory);
      }
    },
  };
}
