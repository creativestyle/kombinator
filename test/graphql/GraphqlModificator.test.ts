import { FieldNode } from 'graphql';
import { GraphqlModificator } from '../../src/graphql/GraphqlModificator';
import { trimMultilineString } from '../helpers';

describe('GraphqlModificator', () => {
  const graphqlString = trimMultilineString(`
        query HelloWorld {
          queryName {
            field
            ...fragment
          }
        }
  `);

  describe('findField', () => {
    it('sets properly activeField', () => {
      const field = new GraphqlModificator().fromString(graphqlString).findField(['queryName']).getField();
      expect(field?.name.value).toEqual('queryName')
    });

    it('adds selectionSetNode to active field when selected to allows nesting', () => {
      const parentField = new GraphqlModificator().fromString(graphqlString).findField(['queryName']).getField();
      // Location of "field"
      expect((parentField?.selectionSet?.selections[0] as FieldNode).selectionSet).toEqual(undefined)

      const field = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).getField();
      expect(field?.selectionSet?.selections).toEqual([])
    });

    it('throws an error if no field found', () => {
      expect(() => new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'notExistingField']).getField())
        .toThrowError('Field "notExistingField" not found in the operation.');
    });

    it('throws an error if "fromString" was not done', () => {
      expect(() => new GraphqlModificator().findField(['queryName']).getField())
        .toThrowError('Graphql AST not loaded.');
    });

    it('throws an error if spread fragment was selected', () => {
      expect(() => new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'fragment']).getField())
        .toThrowError('Operations on fragment spread node are not possible.');
    });
  })

  describe('addFields', () => {
    it('adds field to field without nested fields', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field {
              nestedField
            }
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).addFields(['nestedField']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('adds field to field with nested fields', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field 
            ...fragment
            secondField
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName']).addFields(['secondField']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('adds multiple fields to field with nested fields', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field 
            ...fragment
            secondField
            thirdField
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName']).addFields(['secondField', 'thirdField']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });


    it('adds fragment to field without nested fields', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field {
              ...nestedFragment
            }
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).addFields(['...nestedFragment']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('adds fragment to field with nested fields', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field
            ...fragment
            ...secondFragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName']).addFields(['...secondFragment']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('throws error when active field was not selected', () => {
      expect(() => new GraphqlModificator().fromString(graphqlString).addFields(['secondField']).getString())
        .toThrowError('Missing active field selected or missing selection set.');
    });
  })

  describe('removeFields', () => {
    it('removes fields to selected field node', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName']).removeFields(['field']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('removes fragment spread to selected field node', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName']).removeFields(['...fragment']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('removes fields to selected field node and remove nesting if all removed', () => {
      const graphqlString = trimMultilineString(
        `query HelloWorld {
          queryName {
            field {
              nestedField1
              nestedField2
            }
          }
        }`
      )
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).removeFields(['nestedField1', 'nestedField2']).getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('throws error when active field was not selected', () => {
      expect(() => new GraphqlModificator().fromString(graphqlString).removeFields(['secondField']).getString())
        .toThrowError('Missing active field selected or missing selection set.');
    });
  })

  describe('addVariable', () => {
    it('adds dynamic variable to operation and next to field', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld($variable: String) {
          queryName {
            field(variable: $variable)
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).addVariable('variable', 'String').getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('adds hardcoded variable to next to field', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field(sort: "ASC")
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).addVariable('sort', 'String', 'ASC').getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('adds multiple variables to field', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld($variable: String) {
          queryName {
            field(variable: $variable, sort: "ASC")
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).addVariable('variable', 'String').addVariable('sort', 'String', 'ASC').getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    });

    it('throws error when active field was not selected', () => {
      expect(() => new GraphqlModificator().fromString(graphqlString).addVariable('variable', 'String').getString())
        .toThrowError('Missing active field selected.');
    });
  })

  describe('removeVariable', () => {
    const graphqlString = trimMultilineString(
      `query HelloWorld($variable: String) {
        queryName {
          field(variable: $variable, sort: "ASC")
          ...fragment
        }
      }`
    )

    it('removes dynamic variable from operation and from the field', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld {
          queryName {
            field(sort: "ASC")
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).removeVariable('variable').getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    }); 

    it('removes hardcoded variable from field', () => {
      const expectedGraphql = trimMultilineString(
        `query HelloWorld($variable: String) {
          queryName {
            field(variable: $variable)
            ...fragment
          }
        }`
      )
      const graphqlOutput = new GraphqlModificator().fromString(graphqlString).findField(['queryName', 'field']).removeVariable('sort').getString();
      expect(trimMultilineString(graphqlOutput)).toEqual(expectedGraphql)
    }); 
    
    it('throws error when active field was not selected', () => {
      expect(() => new GraphqlModificator().fromString(graphqlString).removeVariable('variable').getString())
        .toThrowError('Missing active field selected.');
    });
  })
});
