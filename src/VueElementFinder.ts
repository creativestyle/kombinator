type FindByOptions = {
  tagName?: string;
  attributeName?: string;
  attributeValue?: string;
};

export abstract class VueElementFinder {
  protected findBy = '';
  protected findByOptions: FindByOptions | null = null;
  protected template = '';
  protected modifiedCode = '';

  protected findElement(code: string): { element: { startIndex: number; endIndex: number; tagNameEndIndex?: number; closingTagStartIndex?: number; closingTagEndIndex?: number } } {
    let element: { startIndex: number; endIndex: number; tagNameEndIndex?: number; closingTagStartIndex?: number; closingTagEndIndex?: number } | null = null;
    if (this.findBy === 'tagName') {
      element = this.findElementByTag(code, element) as { startIndex: number; endIndex: number; tagNameStartIndex: number; tagNameEndIndex: number };
    } else if (this.findBy === 'attributeValue') {
      element = this.findElementByAttributeValue(code, element);
    } else if (this.findBy === 'attribute') {
      element = this.findElementByAttribute(code, element);
    } else {
      throw new Error('Invalid find options.');
    }
    if (!element) {
      throw new Error('Failed to find element in template.');
    }
  
    // Find tag name and closing tag indices
    const { tagNameEndIndex, closingTagStartIndex, closingTagEndIndex } = this.findTagIndices(code, element.startIndex, element.endIndex);

    return { element: { ...element, tagNameEndIndex, closingTagStartIndex, closingTagEndIndex } };
    
  }

  private findTagIndices(code: string, startIndex: number, endIndex: number) {
    const stack: { name: string; startIndex: number; endIndex: number }[] = [];
    let tagMatch;
    let closingTagMatch;
    let tagNameEndIndex: number | undefined;
    let closingTagStartIndex: number | undefined;
    let closingTagEndIndex: number | undefined;
  
    for (let i = startIndex; i < code.length; i++) {
      const char = code[i];
      if (char === '<') {
        const nextChar = code[i + 1];
        if (nextChar === '/') {
          closingTagMatch = code.slice(i).match(/<\/([^>\s/]*)(?:\s[^>]*)?>/);
          if (closingTagMatch && stack.length && stack[stack.length - 1].name === closingTagMatch[1]) {
            const nestedElement = stack.pop();
            if (nestedElement) {
              closingTagStartIndex = i;
              closingTagEndIndex = closingTagStartIndex + closingTagMatch[0].length;
              if (!stack.length) {
                tagNameEndIndex = nestedElement.startIndex + nestedElement.name.length + 1;
                break;
              }
            }
          }
        } else if (nextChar !== '!' && nextChar !== '?') {
          tagMatch = code.slice(i).match(/<([^>\s/]*)(?:\s[^>]*)?\/?>/);
          if (tagMatch) {
            const name = tagMatch[1];
            const tagStartIndex = i;
            const tagEndIndex = tagStartIndex + tagMatch[0].length;
            stack.push({ name, startIndex: tagStartIndex, endIndex: tagEndIndex });
            if (tagMatch[0].endsWith('/>')) {
              // Adjust stack to account for self-closing tag
              const nestedElement = stack.pop();
              if (nestedElement) {
                if (!stack.length) {
                  tagNameEndIndex = nestedElement.startIndex + nestedElement.name.length + 1;
                  break;
                }
              }
            }
          }
        }
      }
    }
  
    return { tagNameEndIndex, closingTagStartIndex, closingTagEndIndex };
  }

  private findElementByTag(code: string, element: { startIndex: number; endIndex: number; } | null) {
    if(!this.findByOptions?.tagName) {
      throw new Error('Invalid find options.');
    }
    const tagName = this.findByOptions.tagName;
    const regexp = new RegExp(`<${tagName}(?:\\s|\/?>)`);
    const startIndexMatch = code.match(regexp);
    if (startIndexMatch?.index !== undefined) {
      const endIndexMatch = code.slice(startIndexMatch.index).match(/>/);
      if (endIndexMatch?.index !== undefined) {
        const startIndex = startIndexMatch.index;
        const endIndex = startIndexMatch.index + endIndexMatch.index + 1;
        element = { startIndex, endIndex };
      }
    }
    return element;
  }

  private findElementByAttribute(code: string, element: { startIndex: number; endIndex: number; } | null) {
    if(!this.findByOptions?.attributeName) {
      throw new Error('Invalid find options.');
    }
    const attributeName = this.escapeRegExp(this.findByOptions.attributeName);
    const regexp = new RegExp(`<[^>]*\\s${attributeName}(?:\\s*=\\s*['"][^'"]*['"])?[^>]*>`);
    const match = code.match(regexp);
    if (match?.index !== undefined) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      element = { startIndex, endIndex };
    }
    return element;
  }

  private findElementByAttributeValue(code: string, element: { startIndex: number; endIndex: number; } | null) {
    if(!this.findByOptions?.attributeName || !this.findByOptions?.attributeValue) {
      throw new Error('Invalid find options.');
    }
    const attributeName = this.escapeRegExp(this.findByOptions.attributeName);
    const attributeValue = this.escapeRegExp(this.findByOptions.attributeValue);
    const regexp = new RegExp(`<[^>]*\\s${attributeName}\\s*=\\s*"${attributeValue}"[^>]*>`);
    const match = code.match(regexp);
    if (match?.index !== undefined) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      element = { startIndex, endIndex };
    }
    return element;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public fromTemplate(template: string): VueElementFinder {
    this.template = template;
    this.modifiedCode = template;
    return this;
  }

  public findByTag(tagName: string): VueElementFinder {
    this.findBy = 'tagName';
    this.findByOptions = { tagName };
    return this;
  }

  public findByAttribute(name: string): VueElementFinder {
    this.findBy = 'attribute';
    this.findByOptions = { attributeName: name };
    return this;
  }

  public findByAttributeValue(name: string, value: string): VueElementFinder {
    this.findBy = 'attributeValue';
    this.findByOptions = { attributeName: name, attributeValue: value };
    return this;
  }

  public findFirst(): VueElementFinder {
    this.findBy = 'tagName';
    this.findByOptions = {};
    const code = this.modifiedCode;
    const firstTemplateMatch = code.match(/(?<!<(.*)>[\W\w]*)<template[^>]*>/);
    if (firstTemplateMatch) {
      const templateStartIndex = firstTemplateMatch.index! + firstTemplateMatch[0].length;
      const templateEndMatch = code.slice(templateStartIndex).match(/<\/template>/);
      if (templateEndMatch) {
        const templateEndIndex = templateStartIndex + templateEndMatch.index!;
        const templateCode = code.slice(templateStartIndex, templateEndIndex);
        const tagMatch = templateCode.match(/<([^!>\s/]+)/);
        if (tagMatch) {
          this.findByOptions = { tagName: tagMatch[1] };
        }
      }
    } else {
      const tagMatch = code.match(/<([^!>\s/]+)/);
      if (tagMatch) {
        this.findByOptions = { tagName: tagMatch[1] };
      }
    }
    return this;
  }  

  public getTemplate(): string {
    if (this.template == this.modifiedCode) {
      this.findElement(this.template); // Used only to throw selector errrors used in tests
    }
    return this.modifiedCode;
  }
}
