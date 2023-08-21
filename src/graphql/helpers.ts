import { GraphqlFileHandler } from "./GraphqlFileHandler";
import { GraphqlModificator } from "./GraphqlModificator";

export type GraphqlMod = (filenameIn: string) => {
  graphqlModificator: GraphqlModificator,
  saveModifiedGraphql: (filenameOut?: string) => void
};

export const getWithGraphql = (dirs: string[]): GraphqlMod => {

  const withGraphql = (filenameIn: string) => {
    const fileHandler = new GraphqlFileHandler(dirs);  
    fileHandler.load(filenameIn);
    const graphqlString = fileHandler.getGraphqlAsString();
    const graphqlModificator = new GraphqlModificator().fromString(graphqlString);

    return {
      graphqlModificator,
      saveModifiedGraphql(filenameOut?:string) {
        fileHandler.setNewContent(graphqlModificator.getString());
        fileHandler.write(filenameOut);
      }
    }
  
  }

  return withGraphql

}
