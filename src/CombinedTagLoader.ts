import fs from 'fs';

class CombinedTagLoader {
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
      // console.log(componentModStyleTag)
      if (componenModTag.replace) {
        // If the tag in componentMod has the "replace" attribute set to true,
        // replace the entire tag in componentSrc with the tag from componentMod
        this.componentSrcContent = this.componentSrcContent.replace(
          componentSrcTag.content!,
          componenModTag.content!
        );
      } else if (componenModTag.content) {
        // Combine tag content from both files
        const combinedStyleTagContent = componentSrcTag.content! + "\n" + componenModTag.content!;
        // Replace tag content in component source file with combined content
        this.componentSrcContent = this.componentSrcContent.replace(
          componentSrcTag.content!,
          combinedStyleTagContent
        );        
      } 
    }
    return this.componentSrcContent;
  }

  private extractSrcTag(content: string, tag: string): { fullTag?: string; content?: string; replace?: boolean } {
    // Match tag in content
    const matches = content.match(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`);

    if (!matches || matches.length < 2) {
      // tag not found
      return {};
    }

    // Extract tag content and attributes
    const fullTag = matches[0];
    const tagContent = matches[1];
    const replace = Boolean(fullTag.match(/replace/i));    

    return { fullTag, content: tagContent, replace };
  }
}

export default CombinedTagLoader;
