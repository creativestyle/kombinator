import fse from 'fs-extra';
import path from 'path';
import rollup from 'rollup';
import copyParentPlugin from '../src/rollup-plugin-nuxt-copy-from-parent';
import temp from 'temp';
import fs from 'fs-extra';
import { yellow } from 'colorette'

temp.track(); // Automatically track and clean up files at exit

describe('rollup-plugin-nuxt-copy-from-parent', () => {
  let tempDir: string;
  let sourceDir: string;
  let destinationDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = temp.mkdirSync('tempDir');

    // Create a test JS file
    const filePath = path.join(path.join(tempDir, 'input.js'));
    const fileContent = 'console.log("input.js")';
    fs.writeFileSync(filePath, fileContent, 'utf8');

    // Create a source directory with test files
    // tempDir/source/test/test.js
    sourceDir = `${tempDir}/source`;
    fs.mkdirSync(sourceDir);
    fs.mkdirSync(`${sourceDir}/test`);
    fs.writeFileSync(`${sourceDir}/test/test.js`, 'console.log("test")');

    // Create destination directory path
    destinationDir = `${tempDir}/destination`
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
          destinationDir,
          verbose: false,
        }),
      ],
    });

    // Assert that the directories were copied successfully
    expect(fs.existsSync(`${destinationDir}/test/test.js`)).toBe(true);
  });

  it('should not copy directories if destination directory is a git repository', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
    
    // Create a .git file inside destination directory
    fse.ensureDirSync(destinationDir)
    fs.writeFileSync(`${destinationDir}/.git`, 'some .git file content');
    const originalDirContents = fs.readdirSync(destinationDir);

    // Copy files from source directory to destination directory tempDir/destination
    const bundle = await rollup.rollup({
      input: `${tempDir}/input.js`,
      plugins: [
        copyParentPlugin({
          items: ['test'],
          sourceDir,
          destinationDir,
          verbose: false,
        }),
      ],
    });

    // Assert that console.log was called with the expected message
    expect(spy).toHaveBeenCalledWith(yellow(`.git exists in ${destinationDir}. Copy from parent skipped.`));

    // Clean up the spy
    spy.mockRestore();

    // Assert that the directories were not copied
    const currentDirContents = fs.readdirSync(destinationDir);
    expect(currentDirContents).toEqual(originalDirContents);
  });
});
