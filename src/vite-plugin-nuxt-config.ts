import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

function createNuxtConfigFile(directory: string, nuxtConfigTemplate?: string) {
  const defaultTemplate = `// nuxt.config.ts
export default defineNuxtConfig({})
`;

  const content = nuxtConfigTemplate || defaultTemplate;
  const filePath = path.resolve(directory, 'nuxt.config.ts');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`nuxt.config.ts created at: ${filePath}`);
  } else {
    console.log(`nuxt.config.ts already exists at: ${filePath}`);
  }
}

export default function NuxtConfigPlugin(options: { directory: string, nuxtConfigTemplate?: string }): Plugin {
  return {
    name: 'vite-plugin-nuxt-config',
    apply: 'build',
    configResolved(resolvedConfig) {
      if (resolvedConfig.command === 'build') {
        createNuxtConfigFile(options.directory, options.nuxtConfigTemplate);
      }
    },
  };
}
