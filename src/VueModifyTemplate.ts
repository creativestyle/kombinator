import { VueElementFinder } from "./VueElementFinder";

export type AttributeTransformer = (value: string) => string | null;

export class VueModifyTemplate extends VueElementFinder {
  public fromTemplate(template: string): VueModifyTemplate {
    super.fromTemplate(template);
    return this;
  }

  public findByTag(tagName: string, tagNameIndex: number = 0): VueModifyTemplate {
    super.findByTag(tagName, tagNameIndex);
    return this;
  }

  public findByAttribute(name: string): VueModifyTemplate {
    super.findByAttribute(name);
    return this;
  }

  public findByAttributeValue(name: string, value: string): VueModifyTemplate {
    super.findByAttributeValue(name, value);
    return this;
  }

  public findFirst(): VueModifyTemplate {
    super.findFirst();
    return this;
  }

  public removeAttribute(name: string): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    const modifiedElement = this.modifiedCode.slice(element.startIndex, element.endIndex).replace(new RegExp(` ${name}?(="[^"]*")?`, 'g'), '').trim();
    this.modifiedCode = this.modifiedCode.slice(0, element.startIndex) + modifiedElement + this.modifiedCode.slice(element.endIndex);
    return this;
  }
  
  public reduceAttribute(name: string, value: string): VueModifyTemplate {    
    const { element } = this.findElement(this.modifiedCode);
    let modifiedElement = this.modifiedCode.slice(element.startIndex, element.endIndex);
    modifiedElement = modifiedElement.replace(new RegExp(` ${name}="([^"]*)"?`, 'g'), (match, p1) => {
      const newValue = p1.replace(value, '').trim();
      return newValue ? ` ${name}="${newValue}"` : '';
    }).trim();
    this.modifiedCode = this.modifiedCode.slice(0, element.startIndex) + modifiedElement + this.modifiedCode.slice(element.endIndex);
  
    return this;
  }

  public regexpAttribute(name: string, regexp: RegExp, replace: string): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    let modifiedElement = this.modifiedCode.slice(element.startIndex, element.endIndex);
    modifiedElement = modifiedElement.replace(new RegExp(` ${name}="([^"]*)"?`), (match, p1) => {
      if (!p1) {
        throw new Error(`Attribute "${name}" does not exist.`);
      }
      return ` ${name}="${p1.replace(regexp, replace)}"`;
    }).trim();
    this.modifiedCode = this.modifiedCode.slice(0, element.startIndex) + modifiedElement + this.modifiedCode.slice(element.endIndex);
    return this;
  }

  public extendAttribute(name: string, value: string, glue = ' '): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    let modifiedElement = this.modifiedCode.slice(element.startIndex, element.endIndex);
    modifiedElement = modifiedElement.replace(new RegExp(` ${name}="([^"]*)"?`, 'g'), (match, p1) => {
      const newValue = p1 ? `${p1.trim()}${glue}${value.trim()}` : value.trim();
      return ` ${name}="${newValue}"`;
    }).trim();
    if (!modifiedElement.includes(name)) {
      const newAttribute = ` ${name}="${value.trim()}"`;
      const isSelfClosing = modifiedElement.endsWith('/>');
      const indexOfClosingBracket = modifiedElement.lastIndexOf('>');
      if (isSelfClosing) {
        modifiedElement = `${modifiedElement.slice(0, -2)}${newAttribute}/>`;
      } else {
        modifiedElement = `${modifiedElement.slice(0, indexOfClosingBracket)}${newAttribute}${modifiedElement.slice(indexOfClosingBracket)}`;
      }
    }
    this.modifiedCode = this.modifiedCode.slice(0, element.startIndex) + modifiedElement + this.modifiedCode.slice(element.endIndex);
    return this;
  }  
  
  public setAttribute(name: string, value: string): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    let modifiedElement = this.modifiedCode.slice(element.startIndex, element.endIndex);
    const existingAttributeRegex = new RegExp(`\\s${name}="[^"]*"`);
    if (existingAttributeRegex.test(modifiedElement)) {
      modifiedElement = modifiedElement.replace(existingAttributeRegex, ` ${name}="${value}"`);
    } else {
      modifiedElement = modifiedElement.replace(/(\/?>)$/, ` ${name}="${value}"$1`);
    }
    this.modifiedCode = this.modifiedCode.slice(0, element.startIndex) + modifiedElement + this.modifiedCode.slice(element.endIndex);
    return this;
  }

  public getAttributeValue(name: string): string {
    const { element } = this.findElement(this.modifiedCode);
    let modifiedElement = this.modifiedCode.slice(element.startIndex, element.endIndex);
    const match = modifiedElement.match(new RegExp(` ${name}="([^"]*)"?`));
    return match ? match[1] : "";    
  }  

  public transformAttributeValue(name: string, callback: AttributeTransformer): VueModifyTemplate {
    const currentValue = this.getAttributeValue(name);
    const newValue = callback(currentValue);
    if(newValue === null) {
      this.removeAttribute(name)
    } else {
      this.setAttribute(name, newValue);
    } 
    return this;
  }  

  public removeElement(): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    if (element.closingTagEndIndex) {
      this.modifiedCode = this.modifiedCode.slice(0, element.startIndex) + this.modifiedCode.slice(element.closingTagEndIndex);
    } else {
      this.modifiedCode = this.modifiedCode.slice(0, element.startIndex) + this.modifiedCode.slice(element.endIndex);
    }
    return this;
  }

  public renameElement(newTagName: string): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    const tagNameStartIndex = element.startIndex!;
    const tagNameEndIndex = element.tagNameEndIndex!;
    const newTag = `<${newTagName}`;    
    this.modifiedCode = `${this.modifiedCode.slice(0, tagNameStartIndex)}${newTag}${this.modifiedCode.slice(tagNameEndIndex)}`;
    if(element.closingTagEndIndex) {
      const lengthDiff = newTagName.length - (tagNameEndIndex - tagNameStartIndex) + 1;
      const closingTagStartIndex = element.closingTagStartIndex! + lengthDiff;
      const closingTagEndIndex = element.closingTagEndIndex! + lengthDiff;
      const closingTag = `</${newTagName}>`;
      this.modifiedCode = `${this.modifiedCode.slice(0, closingTagStartIndex)}${closingTag}${this.modifiedCode.slice(closingTagEndIndex)}`;
    }
    return this;  
  }  

  private insertHtml(html: string, before: boolean): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    const index = before ? element.startIndex : element.closingTagEndIndex ?? element.endIndex;
    this.modifiedCode = `${this.modifiedCode.slice(0, index)}${html}${this.modifiedCode.slice(index)}`;
    return this;
  }

  public insertBefore(html: string): VueModifyTemplate {
    return this.insertHtml(html, true);
  }

  public insertAfter(html: string): VueModifyTemplate {
    return this.insertHtml(html, false);
  }

  public unwrap(): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);

    if (!element.closingTagStartIndex) {
      // Element is not wrapping -> remove it
      this.removeElement();
      return this;
    }

    const innerHTMLStart = element.endIndex;
    const innerHTMLEnd = element.closingTagStartIndex;

    const beforeInnerHTML = this.modifiedCode.slice(0, element.startIndex);
    const afterInnerHTML = this.modifiedCode.slice(element.closingTagEndIndex);

    this.modifiedCode = `${beforeInnerHTML}${this.modifiedCode.slice(innerHTMLStart, innerHTMLEnd)}${afterInnerHTML}`;
    return this;
  }

  public getElementCode(): string {
    const { element } = this.findElement(this.modifiedCode);
    return this.modifiedCode.slice(element.startIndex, element.closingTagEndIndex ?? element.endIndex);
  }

  public insertInside(html: string): VueModifyTemplate {
    const { element } = this.findElement(this.modifiedCode);
    if (!element.closingTagStartIndex) {
      throw new Error('insertInside does not support self closing tags');
    }
    this.modifiedCode = `${this.modifiedCode.slice(0, element.closingTagStartIndex)}${html}${this.modifiedCode.slice(element.closingTagStartIndex)}`;
    return this;
  }  
}
