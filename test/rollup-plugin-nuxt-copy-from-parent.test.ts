import fse from 'fs-extra';
import path from 'path';
import rollup from 'rollup';
import copyParentPlugin from '../src/rollup-plugin-nuxt-copy-from-parent';
import temp from 'temp';
import fs from 'fs-extra';

temp.track(); // Automatically track and clean up files at exit

describe('rollup-plugin-nuxt-copy-from-parent', () => {
  let tempDir: string;
  let sourceDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = temp.mkdirSync('tempDir');

    // Create a test JS file
    const filePath = path.join(path.join(tempDir, 'input.js'));
    const fileContent = 'console.log("input.js")';
    fs.writeFileSync(filePath, fileContent, 'utf8');

    // Create a source directory with test files
    // tempDir/
    //   source/
    //     test/
    //       test.js
    sourceDir = `${tempDir}/source`;
    fs.mkdirSync(sourceDir);
    fs.mkdirSync(`${sourceDir}/test`);
    fs.writeFileSync(`${sourceDir}/test/test.js`, 'console.log("test")');
  });

  afterEach(() => {
    // Remove the temporary directory after each test
    temp.cleanupSync();
  });

  it('should copy specified directories to destination directory', async () => {
    // Copy files from source directory to destination directory tempDir/destination
    const bundle = await rollup.rollup({
      input: `${tempDir}/input.js`,
      plugins: [
        copyParentPlugin({
          items: ['test'],
          sourceDir,
          destinationDir: `${tempDir}/destination`,
          verbose: false,
        }),
      ],
    });

    // Assert that the directories were copied successfully
    expect(fs.existsSync(`${tempDir}/destination/test/test.js`)).toBe(true);
  });

  it('should not copy directories if destination directory is a git repository', async () => {
    // Create a .git file inside destination directory
    fse.ensureDirSync(`${tempDir}/destination`)
    fs.writeFileSync(`${tempDir}/destination/.git`, 'some .git file content'); // dktodo: extract destDir into var

    // Copy files from source directory to destination directory tempDir/destination
    const bundle = await rollup.rollup({
      input: `${tempDir}/input.js`,
      plugins: [
        copyParentPlugin({
          items: ['test'],
          sourceDir,
          destinationDir: `${tempDir}/destination`,
          verbose: false,
        }),
      ],
    });

    // Assert that the directories were not copied
    expect(fs.existsSync(`${tempDir}/destination/test/test.js`)).toBe(false);
  });
});
