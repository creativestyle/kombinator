import fs from 'fs';
import path from 'path';
import temp from 'temp';
import { GraphqlFileHandler } from '../../src/graphql/GraphqlFileHandler';

temp.track(); // Automatically track and clean up files at exit

describe('GraphqlFileHandler', () => {
  let generatedDir: string;
  let coreDir: string;

  beforeAll(() => {
    generatedDir = temp.mkdirSync('generated');
    coreDir = temp.mkdirSync('core');
    
    // Create a test Graphql file in the core directory
    const filePath = path.join(path.join(coreDir, 'subdirectory', 'my-query.graphql'));
    const fileContent = 'query helloWorld {\nqueryName { \nfield \n}\n}';
    fs.mkdirSync(path.join(coreDir, 'subdirectory'));
    fs.writeFileSync(filePath, fileContent, 'utf8');
  });

  afterAll(() => {
    temp.cleanupSync();
  });

  it('should load a Graphql file from a given location', () => {
    const graphqlFile = new GraphqlFileHandler([generatedDir, coreDir]);
    graphqlFile.loadByFileName('subdirectory/my-query.graphql');
    const graphqlString = graphqlFile.getGraphqlAsString();

    expect(graphqlString).toBe('query helloWorld {\nqueryName { \nfield \n}\n}');
  });

  it('should find graphql by name', () => {
    const graphqlFile = new GraphqlFileHandler([generatedDir, coreDir]);
    graphqlFile.loadByOperationName('helloWorld');
    const graphqlString = graphqlFile.getGraphqlAsString();

    expect(graphqlString).toBe('query helloWorld {\nqueryName { \nfield \n}\n}');
  });

  it('should set a new graphql string', () => {
    const graphqlFile = new GraphqlFileHandler([generatedDir, coreDir]);
    graphqlFile.loadByFileName('subdirectory/my-query.graphql');
    graphqlFile.setNewContent('query helloWorld {\nnewQueryName { \nnewField \n}\n}');    
    graphqlFile.write();
    const graphqlFileOut = new GraphqlFileHandler([generatedDir, coreDir]);
    graphqlFileOut.loadByFileName('subdirectory/my-query.graphql');
    fs.unlinkSync(path.join(generatedDir, 'subdirectory/my-query.graphql'));
    const graphqlString = graphqlFileOut.getGraphqlAsString();
    
    expect(graphqlString).toBe('query helloWorld {\nnewQueryName { \nnewField \n}\n}');
  });

  it('should write the updated file to a new location / name', () => {
    const graphqlFile = new GraphqlFileHandler([generatedDir, coreDir]);
    graphqlFile.loadByFileName('subdirectory/my-query.graphql');
    graphqlFile.setNewContent('query helloWorld {\nnewQueryName { \nnewField \n}\n}'); 

    graphqlFile.write('foo/new-query.graphql');
    const newFileContent = fs.readFileSync(generatedDir + '/foo/new-query.graphql', 'utf8');
    expect(newFileContent).toContain('query helloWorld {\nnewQueryName { \nnewField \n}\n}');
  });
});
