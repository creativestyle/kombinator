import fs from 'fs';
import path from 'path';
import temp from 'temp';
import VueFileHandler from '../src/VueFileHandler';

temp.track(); // Automatically track and clean up files at exit

describe('VueFileHandler', () => {
  let generatedDir: string;
  let coreDir: string;

  beforeAll(() => {
    generatedDir = temp.mkdirSync('generated');
    coreDir = temp.mkdirSync('core');
    
    // Create a test Vue file in the core directory
    const filePath = path.join(path.join(coreDir, 'subdirectory', 'my-component.vue'));
    const fileContent = '<template>\n<div>Hello world</div>\n</template>';
    fs.mkdirSync(path.join(coreDir, 'subdirectory'))
    fs.writeFileSync(filePath, fileContent, 'utf8');
  });

  afterAll(() => {
    temp.cleanupSync();
  });

  it('should load a Vue file from a given location', () => {
    const vueFile = new VueFileHandler([generatedDir, coreDir]);
    vueFile.loadVueFile('subdirectory/my-component.vue');
    const templateString = vueFile.getFileContent();

    expect(templateString).toBe('<template>\n<div>Hello world</div>\n</template>');
  });

  it('should find component by name', () => {
    const vueFile = new VueFileHandler([generatedDir, coreDir]);
    vueFile.loadComponent('my-component');
    const templateString = vueFile.getFileContent();

    expect(templateString).toBe('<template>\n<div>Hello world</div>\n</template>');
  });

  it('should find component with dashes and TitleCased file', () => {    
    const filePath = path.join(path.join(coreDir, 'subdirectory', 'deeper', 'TitleCasedComponent.vue'));
    const fileContent = '<template>\n<div>Hello world</div>\n</template>';
    fs.mkdirSync(path.join(coreDir, 'subdirectory', 'deeper'))
    fs.writeFileSync(filePath, fileContent, 'utf8');
    const vueFile = new VueFileHandler([generatedDir, coreDir]);
    vueFile.loadComponent('title-cased-component');
    const templateString = vueFile.getFileContent();

    expect(templateString).toBe('<template>\n<div>Hello world</div>\n</template>');
  });

  it('should set a new template string', () => {
    const vueFile = new VueFileHandler([generatedDir, coreDir]);
    vueFile.loadVueFile('subdirectory/my-component.vue');
    vueFile.setNewTemplate('<div>New template</div>');    
    vueFile.write();
    const vueFileOut = new VueFileHandler([generatedDir, coreDir]);
    vueFileOut.loadVueFile('subdirectory/my-component.vue');
    fs.unlinkSync(path.join(generatedDir, 'subdirectory/my-component.vue'));
    const templateString = vueFileOut.getFileContent();
    
    expect(templateString).toBe('<template>\n<div>New template</div>\n</template>');
  });

  it('should add a comment to the template', () => {
    const vueFile = new VueFileHandler([generatedDir, coreDir]);
    vueFile.loadVueFile('subdirectory/my-component.vue');
    vueFile.setNewTemplate('<div>New template</div>');    
    vueFile.addTemplateComment('This is a comment');    
    vueFile.write();
    const vueFileOut = new VueFileHandler([generatedDir, coreDir]);
    vueFileOut.loadVueFile('subdirectory/my-component.vue');
    const templateString = vueFileOut.getFileContent();
    fs.unlinkSync(path.join(generatedDir, 'subdirectory/my-component.vue'));
    expect(templateString).toBe('<template>\n<div>New template</div>\n</template><!-- Kombinator: This is a comment -->');
  });

  it('should add multiple comments to the template, maintaining their order', () => {
    const vueFile = new VueFileHandler([generatedDir, coreDir]);
    vueFile.loadVueFile('subdirectory/my-component.vue');
    vueFile.setNewTemplate('<div>New template</div>');
    vueFile.addTemplateComment('This is a comment 1');
    vueFile.addTemplateComment('This is a comment 2');
    vueFile.addTemplateComment('This is a comment 3');
    vueFile.write();
    const vueFileOut = new VueFileHandler([generatedDir, coreDir]);
    vueFileOut.loadVueFile('subdirectory/my-component.vue');
    const templateString = vueFileOut.getFileContent();
    fs.unlinkSync(path.join(generatedDir, 'subdirectory/my-component.vue'));
    expect(templateString).toBe('<template>\n<div>New template</div>\n</template><!-- Kombinator: This is a comment 1 -->\n<!-- Kombinator: This is a comment 2 -->\n<!-- Kombinator: This is a comment 3 -->');
  });

  it('should write the updated file to a new location / name', () => {
    const vueFile = new VueFileHandler([generatedDir, coreDir]);
    vueFile.loadVueFile('subdirectory/my-component.vue');
    vueFile.setNewTemplate('<div>New template</div>');
    // Write the updated file to a temporary directory
    const newFilePath = path.join(temp.mkdirSync('new-subdirectory'), 'new-component.vue');
    vueFile.write('foo/new-component.vue');
    // Read the file content and check if it contains the new template and comment
    const newFileContent = fs.readFileSync(generatedDir + '/foo/new-component.vue', 'utf8');
    expect(newFileContent).toContain('<div>New template</div>');

  });
});
