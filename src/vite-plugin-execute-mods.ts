import { Plugin } from 'vite';
import { readdirSync, lstatSync, realpathSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { emptyDirSync, existsSync } from 'fs-extra';
import { getWithComponent, TemplateMod } from './helpers';
import { green, yellow } from 'colorette'
import VueFileHandler from './VueFileHandler';
import CombinedTagLoader from './CombinedTagLoader';

export interface ModsPluginOptions {
  modsDir: string;
  localComponentsDir: string;
  componentsDir: string[];
  verbose: boolean;
}

export default function modsPlugin(options: ModsPluginOptions): Plugin {

  const withComponent = getWithComponent(options.componentsDir);
  let initialized = false;

  function executeMods(callback: TemplateMod, dirPath: string): string[] {  
    const executed: string[] = [];
    if(!existsSync(dirPath)) return [];
    const files = readdirSync(dirPath).sort();
  
    files.forEach((file) => {
      const filePath = `${dirPath}/${file}`;
      if (lstatSync(filePath).isDirectory()) {
        if(options.verbose) {
          console.log(green(`Reading directory ${filePath}`))
        }
        executeMods(callback, filePath);
      } else if (filePath.endsWith('.mod.ts')) {
        const fullFilePath = realpathSync(filePath);
        const mod = require(fullFilePath);
        executed.push(fullFilePath);
        if(options.verbose) {
          console.log(green(`Processing ${filePath}`))
        }
        if (typeof mod === 'function') {
          if(options.verbose) {
            console.log(green(`Calling ${filePath}`))
          }
          mod(callback);
        }
      }
    });
    return executed;
  }

  function processVueMods(componentsPath: string): string[] {  
    const executed: string[] = [];
    console.log(yellow(componentsPath))
    if(!existsSync(componentsPath)) return executed;
    const files = readdirSync(componentsPath);
    console.log(files)
  
    files.forEach((file) => {
      const filePath = `${componentsPath}/${file}`;
      if (lstatSync(filePath).isDirectory()) {
        if(options.verbose) {
          console.log(green(`Reading directory ${filePath}`))
        }
        processVueMods(filePath);
      } else if (filePath.endsWith('.mod.vu')) {                
        const modFilePath = realpathSync(filePath);        
        const componentFileName = filePath.replace('.mod.vu','.vue').replace(options.localComponentsDir,'');
                
        if(options.verbose) {
          console.log(green(`Processing ${modFilePath}`));
        }
        executed.push(modFilePath);
        const fileHandler = new VueFileHandler(options.componentsDir).loadVueFile(componentFileName);
        const componentFilePath = fileHandler.getFullPath();

        const newCode = new CombinedTagLoader().loadComponent(componentFilePath!, modFilePath).getCode();
        fileHandler.setNewFileContent(newCode);
        fileHandler.addTemplateComment("Applied " + filePath);
        fileHandler.write();
      }
    });
    return executed
  }

  return {
    name: 'mods-plugin',
    buildStart: {
      order: "pre",
      handler() {
        if(!initialized) {
          emptyDirSync(options.componentsDir[0]);
          initialized = true;
          executeMods(withComponent, options.modsDir).forEach(file => this.addWatchFile(file));
          processVueMods(options.localComponentsDir).forEach(file => this.addWatchFile(file));
        }        
      }
    },
    async handleHotUpdate({ file, server }) {      
      if (file.endsWith('.mod.ts') || file.endsWith('.mod.vue')) {
        emptyDirSync(options.componentsDir[0]);
        executeMods(withComponent, options.modsDir);
        processVueMods(options.localComponentsDir);
      }    
    },
  };
}
