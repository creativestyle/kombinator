import * as fse from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import { Plugin } from 'rollup';
import { green, yellow } from 'colorette'

interface CopyParentPluginOptions {
  items?: string[];
  sourceDir: string;
  destinationDir: string;
  verbose: boolean;
}

function copyParentPlugin(options: CopyParentPluginOptions): Plugin {
  let items = options.items || ['components', 'pages', 'layouts'];
  let initialized = false;

  return {
    name: 'rollup-plugin-nuxt-copy-from-parent',

    buildStart: {
      order: 'pre',
      handler() {
        if (initialized) {
          if(options.verbose) {            
            console.log(yellow("Seems this is started second time (server/client build). Skipping."));
          }
          return;
        }  
        initialized = true;  
        if (fs.existsSync(path.join(options.destinationDir, '.git'))) {
          console.log(yellow(`.git exists in ${options.destinationDir}. Copy from parent skipped.`));
          return;
        }
  
        for (let what of items) {
          let targetDir = path.join(options.destinationDir, what);
          let sourceDir = path.join(options.sourceDir, what);

          try {
            fse.emptyDirSync(targetDir);
  
            if (fs.existsSync(sourceDir)) {
              if(options.verbose) {
                console.log(green(`Copying ${sourceDir} to ${targetDir}`));
              }
              fse.copySync(sourceDir, targetDir);
            }
          } catch (error) {
            this.error(error as string);
          }
        }  
      }
    }
  };
}

export default copyParentPlugin;
