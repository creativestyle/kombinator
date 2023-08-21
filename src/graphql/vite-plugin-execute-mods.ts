import { Plugin } from 'vite';
import { readdirSync, lstatSync, realpathSync, existsSync } from 'fs';
import { emptyDirSync } from 'fs-extra';
import { getWithGraphql, GraphqlMod } from './helpers';
import { green } from 'colorette'
import path from 'path';

export interface ModsPluginOptions {
  modsDir: string;
  graphqlDirs: string[];
  verbose: boolean;
}

export default function modsPlugin(options: ModsPluginOptions): Plugin {

  const withGraphql = getWithGraphql(options.graphqlDirs);
  let initialized = false;

  function executeMods(callback: GraphqlMod, dirPath: string): string[] {  
    const executed: string[] = [];
    if(!existsSync(dirPath)) return [];
    const files = readdirSync(dirPath).sort();
  
    files.forEach((file) => {
      const filePath = `${dirPath}/${file}`;
      if (lstatSync(filePath).isDirectory()) {
        if(options.verbose) {
          console.log(green(`Reading a directory ${filePath}`))
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

  return {
    name: 'graphql-mods-plugin',
    buildStart: {
      order: "pre",
      handler() {
        if(!initialized) {
          emptyDirSync(options.graphqlDirs[0]);
          initialized = true;
          executeMods(withGraphql, options.modsDir).forEach(file => this.addWatchFile(file));
        }        
      }
    },
    async handleHotUpdate({ file }) {
      const parentComponentsPath = path.join(process.cwd(), options.graphqlDirs[1])
      const fileIsParentComponent = file.startsWith(parentComponentsPath)
      if (file.endsWith('.mod.ts') || fileIsParentComponent) {
        emptyDirSync(options.graphqlDirs[0]);
        executeMods(withGraphql, options.modsDir);
      }    
    },
  };
}
