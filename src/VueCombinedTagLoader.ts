import fs from 'fs';

export class VueCombinedTagLoader {
  private tags:string[] = ["style", "script"];

  private componentSrcContent: string = "";
  private componentModContent: string = "";

  public setTag(tags: string[]): this {
    this.tags = tags
    return this;
  }

  public loadComponent(componentSrcPath: string, componentModPath: string): this {
    // Load component source file
    this.componentSrcContent = fs.readFileSync(componentSrcPath, 'utf8');
    // Load component mod file
    this.componentModContent = fs.readFileSync(componentModPath, 'utf8');
    return this;
  }

  public getCode(): string {
    for(let tag of this.tags) {
      // Extract tag from component source file
      const componentSrcTag = this.extractSrcTag(this.componentSrcContent, tag);
      // Extract tag from component mod file
      const componenModTag = this.extractSrcTag(this.componentModContent, tag);
      if (componenModTag.operation?.match("replace")) {
        if(!componentSrcTag.content) {
          throw Error(`You cannot replace if parent have no ${tag}`);
        } 
        // If the tag in componentMod has the "replace" attribute set to true,
        // replace the entire tag in componentSrc with the tag from componentMod
        this.componentSrcContent = this.componentSrcContent.replace(
          componentSrcTag.content!,
          componenModTag.content!
        );
      } else if (componenModTag.operation?.match("merge") && componenModTag.content) {

        if(componentSrcTag.content) {
          // Combine tag content from both files
          const combinedStyleTagContent = componentSrcTag.content! + "\n" + componenModTag.content!;
          // Replace tag content in component source file with combined content
          this.componentSrcContent = this.componentSrcContent.replace(
            componentSrcTag.content!,
            combinedStyleTagContent
          );        
        } else {
          this.componentSrcContent = this.componentSrcContent + "\n" + componenModTag.openTag + componenModTag.content + `</${tag}>`;
        }

      } 
    }
    return this.componentSrcContent;
  }

  private extractSrcTag(content: string, tag: string): { fullTag?: string; content?: string; openTag?: string; operation?: string } {
    // Match tag in content
    const matches = content.match(`(<${tag}[^>]*?(\\s+kom(?:binator)?="([^"]+)")?\\s*>)([\\s\\S]*?)<\/${tag}>`);
    if (!matches || matches.length < 2) {
      // tag not found
      return {};
    }

    // Extract tag content and attributes
    const fullTag = matches[0];
    const openTag = matches[1].replace(matches[2], '');
    let operation = matches[3]?.trim();
    if(!operation) {
      operation = tag == 'template' ? 'replace' : 'merge';
    } 
    const tagContent = matches[4];

    return { fullTag, content: tagContent, openTag, operation };
  }
}

