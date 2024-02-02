import fse from 'fs-extra';
import path from 'path';
import temp from 'temp';
import { rollup, type Plugin } from 'rollup';
import modsPlugin, { type ModsPluginOptions } from '../src/vite-plugin-execute-mods';
import vuePlugin from 'rollup-plugin-vue'
import { trimMultilineString } from './helpers';

temp.track(); // Automatically track and clean up files at exit

describe('vite-plugin-execute-mods', () => {
  let tempDir: string;
  let sourceDir: string;
  let sourceFilePath: string;
  let modsDir: string;
  let destinationDir: string;
  let localComponentsDir: string;
  let options: ModsPluginOptions;
  let plugin: Plugin;

  beforeEach(() => {
    initializeDirsStructure()

    options = {
      modsDir: modsDir,
      localComponentsDir: localComponentsDir,
      componentsDir: [destinationDir, sourceDir],
      verbose: false,
      tags: ['script', 'template', 'style']
    };
    plugin = modsPlugin(options);
  });

  afterEach(() => {
    // Remove the temporary directory after each test
    temp.cleanupSync();
  });

  describe('template mods', () => {
    it('should modify vue SFC template', async () => {
      // add template mod files
      const mod1FilePath = path.join(modsDir, 'HelloWorld1.mod.ts')
      fse.writeFileSync(mod1FilePath, getTestModContent('First mod'));
      const mod2FilePath = path.join(modsDir, 'HelloWorld2.mod.ts')
      fse.writeFileSync(mod2FilePath, getTestModContent('Second mod'));

      function getTestModContent(text: string) {
        return `
        module.exports = function (withComponent: any) {
          const t = withComponent('HelloWorld')
          t.templateModificator
            .findByTag('div')
            .insertAfter('<span>${text}</span>')
          t.saveModifiedTemplate()
        }`
      };

      const outputFileContent = await getRollupOutput()
  
      const expectedFileContent = trimMultilineString(`
        <template>
          <div>Hello, World!</div><span>Second mod</span><span>First mod</span>
        </template>
        <!-- Kombinator: HelloWorld1.mod.ts:7:13 -->
        <!-- Kombinator: HelloWorld2.mod.ts:7:13 -->
        
        <script setup>
        console.log("Hello");
        </script>
      `).trim();
  
      expect(outputFileContent).toBe(expectedFileContent)
    });
  })

  describe('vue mods', () => {
    it('should extend existing script', async () => {
      // add vue script mod
      const modFilePath = path.join(localComponentsDir, 'HelloWorld.mod.vue')
      fse.writeFileSync(modFilePath, `<script setup>\nconsole.log("Appended by mod");\n</script>`);

      const outputFileContent = await getRollupOutput()
      
      const expectedFileContent = trimMultilineString(`
        <template>
          <div>Hello, World!</div>
        </template>
        <!-- Kombinator: Applied vue mod ${modFilePath} -->
        
        <script setup>
        console.log("Hello");


        console.log("Appended by mod");
        </script>
      `).trim();

      expect(outputFileContent).toBe(expectedFileContent)
    })

    it('should replace existing script with kombinator="replace"', async () => {
      // add vue script mod
      const modFilePath = path.join(localComponentsDir, 'HelloWorld.mod.vue')
      fse.writeFileSync(modFilePath, `<script setup kombinator="replace">\nconsole.log("Replaced by mod");\n</script>`);

      const outputFileContent = await getRollupOutput()
      
      const expectedFileContent = trimMultilineString(`
        <template>
          <div>Hello, World!</div>
        </template>
        <!-- Kombinator: Applied vue mod ${modFilePath} -->
        
        <script setup>
        console.log("Replaced by mod");
        </script>
      `).trim();

      expect(outputFileContent).toBe(expectedFileContent)
    })
  })

  async function getRollupOutput() {
    await rollup({
      input: sourceFilePath,
      plugins: [
        vuePlugin(),
        plugin
      ],
      external: ['vue']
    });

    const outputFilePath = path.join(destinationDir, 'HelloWorld.vue')
    const outputFileContent = fse.readFileSync(outputFilePath, 'utf-8').trim()
    return outputFileContent
  }

  function initializeDirsStructure() {
    // Create a temporary directory for testing
    tempDir = temp.mkdirSync('tempDir');

    // Create a test source Vue SFC file: tempDir/core/components/HelloWorld.vue
    sourceDir = path.join(tempDir, 'core', 'components');
    fse.mkdirSync(sourceDir, { recursive: true });
    sourceFilePath = path.join(sourceDir, 'HelloWorld.vue');
    const sourceFileContent = '<template>\n<div>Hello, World!</div>\n</template>\n\n<script setup>\nconsole.log("Hello");\n</script>\n';
    fse.writeFileSync(sourceFilePath, sourceFileContent, 'utf8');

    // Create a directory with template mods: tempDir/mods
    modsDir = path.join(tempDir, 'mods');
    fse.mkdirSync(modsDir);

    // Create destination directory: tempDir/.kombinator/components
    destinationDir = path.join(tempDir, '.kombinator', 'components');
    fse.mkdirSync(destinationDir, { recursive: true });

    // Create local components directory: tempDir/components
    localComponentsDir = path.join(tempDir, 'components');
    fse.mkdirSync(localComponentsDir);
  }
});