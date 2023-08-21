import { 
  parse,
  print, 
  DocumentNode, 
  Kind, 
  ArgumentNode, 
  VariableDefinitionNode, 
  ExecutableDefinitionNode, 
  SelectionNode, 
  FieldNode,
  SelectionSetNode
} from 'graphql'

export class GraphqlModificator {
  protected originalCodeAST: DocumentNode | null = null;
  protected modifiedCodeAST: DocumentNode | null = null;
  protected content = '';
  protected operation: ExecutableDefinitionNode | null = null;
  protected activeField: FieldNode | null = null;

  public fromString(content: string): GraphqlModificator {
    this.content = content
    this.originalCodeAST = parse(content);
    this.modifiedCodeAST = parse(content);
    this.operation = this.modifiedCodeAST.definitions[0] as ExecutableDefinitionNode

    if (!this.operation) {
      throw new Error('Graphql missing operation (query, mutation, fragment, subscription)');
    }

    return this;
  }

  findField(fieldPath: string[]) {
    if (!this.operation) {
      throw new Error('Graphql AST not loaded.');
    }

    let activeField: ExecutableDefinitionNode | FieldNode = this.operation
    
    for (const fieldName of fieldPath) {
      const field: SelectionNode | undefined = activeField.selectionSet?.selections.find((selection)=> (selection.kind === Kind.FIELD || selection.kind === Kind.FRAGMENT_SPREAD) && selection.name.value === fieldName)
      if (!field) {
        throw new Error(`Field "${fieldName}" not found in the operation.`);
      }
      if (field.kind === Kind.FRAGMENT_SPREAD) {
        throw new Error('Operations on fragment spread node are not possible.');
      }
      
      // SelectionSet is required to enable add nested fields. And its not there by default when field had no nesting.
      if (!field.selectionSet) {
        const newSelectionSet: SelectionSetNode = {
          kind: Kind.SELECTION_SET,
          selections: [],
        };

        // Need to keep reference and ignore read-only property for selectionSet.
        // We need to operate on references as modifications we do needs to be "updated" on main this.modifiedCodeAST.
        // Otherwise previous modifications doesnt persist for next modifications.
        (field as { selectionSet: SelectionSetNode }).selectionSet = newSelectionSet
      }
      activeField = field as FieldNode
    }

    this.activeField = activeField as FieldNode

    return this
  }

  addFields(fieldsToAdd: string[]) {
    if (!this.activeField?.selectionSet) {
      throw new Error('Missing active field selected or missing selection set.');
    }

    this.activeField.selectionSet.selections = [ 
      ...this.activeField.selectionSet.selections as FieldNode[], 
      ...fieldsToAdd.map((name) => ({
        kind: name.includes('...') ? Kind.FRAGMENT_SPREAD : Kind.FIELD,
        name: { kind: Kind.NAME, value: name.replace('...', '') },
      })) as FieldNode[],
    ]

    return this
  }

  removeFields(fieldsToRemove: string[]) {
    if (!this.activeField?.selectionSet) {
      throw new Error('Missing active field selected or missing selection set.');
    }
    
    this.activeField.selectionSet.selections = this.activeField.selectionSet.selections.filter(
      (selection) => (selection.kind === Kind.FRAGMENT_SPREAD || selection.kind === Kind.FIELD) && !fieldsToRemove.map((field) => field.replace('...', '')).includes(selection.name.value)
    )
  
    return this
  }

  removeVariable(variableName: string) {
    if (!this.activeField) {
      throw new Error('Missing active field selected.');
    }
    
    if (!this.operation) {
      throw new Error('Graphql AST not loaded');
    }

    if (this.activeField.arguments) {
      const newArgumentSet: ArgumentNode[] = this.activeField.arguments.filter(
        (argument) => argument.name.value !== variableName
      );
      
      // Need to keep reference and ignore read-only property for arguments.
      // We need to operate on references as modifications we do needs to be "updated" on main this.modifiedCodeAST.
      // Otherwise previous modifications doesnt persist for next modifications.
      (this.activeField as { arguments?: ArgumentNode[] }).arguments = newArgumentSet;
    }

    // Need to keep reference and ignore read-only property for variableDefinitions.
    // We need to operate on references as modifications we do needs to be "updated" on main this.modifiedCodeAST.
    // Otherwise previous modifications doesnt persist for next modifications.
    if (this.operation.variableDefinitions) {
      (this.operation as { variableDefinitions?: VariableDefinitionNode[] }).variableDefinitions = this.operation.variableDefinitions.filter(
        (variableDef) => variableDef.variable.name.value !== variableName
      );
    }
    return this
  }

  addVariable(variableName: string, variableType: string, hardcodedValue: string | null = null) {
    if (!this.activeField) {
      throw new Error('Missing active field selected.');
    }
    
    if (!this.operation) {
      throw new Error('Graphql AST not loaded');
    }

    const newArgument: ArgumentNode = {
      kind: Kind.ARGUMENT,
      name: { kind: Kind.NAME, value: variableName },
      value: hardcodedValue
        ? { kind: Kind.STRING, value: hardcodedValue }
        : { kind: Kind.VARIABLE, name: { kind: Kind.NAME, value: variableName } },
    };

    const updatedArguments = [
      ...(this.activeField.arguments || []), 
      newArgument,
    ];

    // Need to keep reference and ignore read-only property for arguments.
    // We need to operate on references as modifications we do needs to be "updated" on main this.modifiedCodeAST.
    // Otherwise previous modifications doesnt persist for next modifications.
    (this.activeField as { arguments?: ArgumentNode[] }).arguments = updatedArguments 

    if (!hardcodedValue) {
      const newVariableDefinition: VariableDefinitionNode = {
        kind: Kind.VARIABLE_DEFINITION,
        variable: { kind: Kind.VARIABLE, name: { kind: Kind.NAME, value: variableName } },
        type: { kind: Kind.NAMED_TYPE, name: { kind: Kind.NAME, value: variableType } }
      };
  
      const updatedVariableDefinitions = [
        ...(this.operation.variableDefinitions || []),
        newVariableDefinition,
      ];

      // Need to keep reference and ignore read-only property for variableDefinitions.
      // We need to operate on references as modifications we do needs to be "updated" on main this.modifiedCodeAST.
      // Otherwise previous modifications doesnt persist for next modifications.
      (this.operation as { variableDefinitions?: VariableDefinitionNode[] }).variableDefinitions = updatedVariableDefinitions
    }

    return this
  }

  getField(): FieldNode | null {
    return this.activeField
  }

  getString(): string {
    if (!this.modifiedCodeAST) {
      throw new Error('Graphql AST not loaded');
    }

    return print(this.modifiedCodeAST)
  }
}
