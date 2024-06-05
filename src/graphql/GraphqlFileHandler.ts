import fs from 'fs';
import path from 'path';
import { sync as globSync } from 'glob';
import { DocumentNode, ExecutableDefinitionNode, parse } from 'graphql'

export class GraphqlFileHandler {
  private directories: string[];
  private filePath: string | null = null;
  private fileName: string | null = null;
  private fileContent: string | null = null;
  private newFileContent: string | null = null;

  constructor(directories: string[]) {
    this.directories = directories;
  }
  
  loadByFileName(fileName: string): GraphqlFileHandler {
    this.fileName = fileName;
    
    const filePathParts = fileName.split('/');
    for (const directory of this.directories) {
      const fullPath = [...filePathParts];
      fullPath.unshift(directory);
      const filePath = path.join(...fullPath);
      if (fs.existsSync(filePath)) {
        this.filePath = filePath;
        this.fileContent = fs.readFileSync(this.filePath, 'utf8');
        break;
      }
    }

    if (!this.filePath) {
      throw new Error(`File ${fileName} not found in ${this.directories.join(', ')}`);
    }
    return this;
  }

  loadByOperationName(operationName: string): GraphqlFileHandler {
    const browseFiles = (glob: string[]) => {

      // first found path is important. Break doesn't stop the recurrence
      if (this.filePath) {
        return
      }
      const files = globSync(glob)
      for (const filePath of files) {
        if (fs.lstatSync(filePath).isDirectory()) {
          const files = fs.readdirSync(filePath).sort().map((path: string) => `${filePath}/${path}`)
          browseFiles(files)
        } else if (filePath.endsWith('.graphql')) {
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          const documentNode: DocumentNode = parse(fileContent)
          const operation: ExecutableDefinitionNode = documentNode.definitions[0] as ExecutableDefinitionNode

          if (!operation?.name) {
            return
          }

          const operationNameFromFile = operation.name.value

          if (operationName === operationNameFromFile) {
            this.filePath = filePath;
            this.fileName = path.basename(filePath);
            this.fileContent = fileContent
            break;
          }
        }
      }
    }

    browseFiles(this.directories)
  
    if (!this.filePath) {
      throw new Error(`Graphql ${operationName} not found in ${this.directories.join(', ')}`);
    }
  
    return this;
  }

  load(filenameIn: string): GraphqlFileHandler {
    if(filenameIn.endsWith('.graphql')) {
      return this.loadByFileName(filenameIn);
    } 
    return this.loadByOperationName(filenameIn);
  }

  setNewContent(newContentString: string): GraphqlFileHandler {
    this.newFileContent = newContentString ?? null;
    return this;
  }

  getGraphqlAsString(): string {
    return this.fileContent || ''
  }

  write(newFilePath?: string): void {
    if (!newFilePath) {
      newFilePath = this.fileName!;
    } 

    const firstDirectory = this.directories[0];
    const newDirectoryPath = newFilePath.split('/').slice(0, -1).join('/');
    const newDirectory = path.join(firstDirectory, newDirectoryPath);

    if (!fs.existsSync(newDirectory)) {
      fs.mkdirSync(newDirectory, { recursive: true });
    }

    const newFileContent = this.newFileContent ?? this.fileContent;
    const newFile = path.join(firstDirectory, newFilePath);

    fs.writeFileSync(newFile, newFileContent!);
  }
}
