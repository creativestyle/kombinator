import { VueModifyTemplate } from '../src/VueModifyTemplate';

export function trimMultilineString(str:string, keepLines = true) {
  return str
    .split('\n') // Split the string into an array of lines
    .map((line) => line.trim()) // Trim each line
    .join(keepLines ? '\n' : ''); // Join the lines back into a string
}

describe('VueModifyTemplate', () => {
  const template = trimMultilineString(`
        <template>
          <div class="container">
            <h1>Hello, world!</h1>
            <component/>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </template>
  `);

  const templateLine = trimMultilineString(template);

  describe('findByTag', () => {
    it('finds an element by tag name', () => {
      const template = '<div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByTag('div').getTemplate();
      expect(result).toEqual(template);
    });
  
    it('finds an self closing component by tag name', () => {
      const template = '<div><comp/></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByTag('comp').getTemplate();
      expect(result).toEqual(template);
    });

    it('finds the first occurrence of an element by tag name', () => {
      const template = '<div class="foo"></div><div class="foo"></div>';
      const expected = '<div class="foo bar"></div><div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByTag('div').extendAttribute('class', 'bar').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('throws an error if no elements match the tag name', () => {
      const template = '<div class="foo"></div>';
      expect(() => new VueModifyTemplate().fromTemplate(template).findByTag('span').getTemplate()).toThrowError('Failed to find element in template.');
    });
  
  });

  describe('findByAttribute', () => {
    it('finds an element by attribute name', () => {
      const template = '<div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('class').getTemplate();
      expect(result).toEqual(template);
    });

    it('finds an element even when attribute name contains special characters', () => {
      const attributeName = 'v-bind:[class]'
      const template = `<some-component ${attributeName}="foo"></some-component>`;
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute(attributeName).getTemplate();
      expect(result).toEqual(template);
    });

    it('finds an element by attribute name with no value', () => {
      const template = '<div class="foo" data-qa-info></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('data-qa-info').getTemplate();
      expect(result).toEqual(template);
    });
  
    it('finds the first occurrence of an element by attribute name', () => {
      const template = '<div class="foo"></div><div class="foo"></div>';
      const expected = '<div class="foo bar"></div><div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('class').extendAttribute('class', 'bar').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('throws an error if no elements have the attribute', () => {
      const template = '<div></div>';
      expect(() => new VueModifyTemplate().fromTemplate(template).findByAttribute('class').getTemplate()).toThrowError('Failed to find element in template.');
    });

    it('throws an error if only partially matched', () => {
      const template = '<div data-attr-foo-bar></div>';
      expect(() => new VueModifyTemplate().fromTemplate(template).findByAttribute('class').getTemplate()).toThrowError('Failed to find element in template.');
    });

  });
  
  describe('findByAttributeValue', () => {
    it('finds an element by attribute value', () => {
      const template = '<some-component data-for="money"></some-component>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttributeValue('data-for', 'money').getTemplate();
      expect(result).toEqual(template);
    });

    it('finds an element even when attribute name and value contains special characters', () => {
      const attributeName = 'v-bind:[class]'
      const attributeValue = `group-[:nth-of-type(1)_&]:after:content-['*']`
      const template = `<some-component ${attributeName}="${attributeValue}"></some-component>`;
      const result = new VueModifyTemplate().fromTemplate(template).findByAttributeValue(attributeName, attributeValue).getTemplate();
      expect(result).toEqual(template);
    });
  
    it('finds an element by attribute value with extra spaces', () => {
      const template = '<some-component data-for = "money"></some-component>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttributeValue('data-for', 'money').getTemplate();
      expect(result).toEqual(template);
    });
  
    it('finds the first element with the matching attribute value', () => {
      const template = '<some-component data-for="money"></some-component><some-component data-for="money"></some-component>';
      const expected = '<some-component data-for="fun"></some-component><some-component data-for="money"></some-component>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttributeValue('data-for', 'money').setAttribute('data-for','fun').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('throws an error when the attribute value does not exist', () => {
      const template = '<some-component data-for></some-component>';
      expect(() => {
        new VueModifyTemplate().fromTemplate(template).findByAttributeValue('data-for', 'money').getTemplate();
      }).toThrowError('Failed to find element in template.');
    });
  
    it('throws an error when the attribute value matches only partially', () => {
      const template = '<some-component data-for="money"></some-component>';
      expect(() => {
        new VueModifyTemplate().fromTemplate(template).findByAttributeValue('data-for', 'mo').getTemplate();
      }).toThrowError('Failed to find element in template.');
    });

    it('throws an error when the attribute name does not exist', () => {
      const template = '<some-component data-for="money"></some-component>';
      expect(() => {
        new VueModifyTemplate().fromTemplate(template).findByAttributeValue('invalid', 'money').getTemplate();
      }).toThrowError('Failed to find element in template.');
    });
  });
  
  describe('findFirst', () => {
    it('should find the first tag in the template', () => {
      const template = '<div><span></span></div>';
      const expected = '<div id="foo"><span></span></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findFirst().setAttribute('id', 'foo').getTemplate();
      expect(result).toBe(expected);
    });

    it('should find the first tag in the template, but not <template>', () => {
      const template = '<template><div><span></span></div></template>';
      const expected = '<template><div id="foo"><span></span></div></template>';
      const result = new VueModifyTemplate().fromTemplate(template).findFirst().setAttribute('id', 'foo').getTemplate();
      expect(result).toBe(expected);
    });

    it('should find the first tag in the template if it is self closing', () => {
      const template = '<component/>';
      const expected = '<component id="foo"/>';
      const result = new VueModifyTemplate().fromTemplate(template).findFirst().setAttribute('id', 'foo').getTemplate();
      expect(result).toBe(expected);
    });

    it('should find the first tag in the template which contains components with another <template> tag', () => {
      const template = `
        <component>
          <template></template>
        </component>
      `;
      const expected = `
        <component id="foo">
          <template></template>
        </component>
      `;
      const result = new VueModifyTemplate().fromTemplate(template).findFirst().setAttribute('id', 'foo').getTemplate();
      expect(result).toBe(expected);
    });

    it('should find the first tag in the template which contains comments', () => {
      const template = `
        <!-- Comment -->
        <component/>
      `;
      const expected = `
        <!-- Comment -->
        <component id="foo"/>
      `;
      const result = new VueModifyTemplate().fromTemplate(template).findFirst().setAttribute('id', 'foo').getTemplate();
      expect(result).toBe(expected);
    });
  });
  
  describe('extendAttribute', () => {
    const template = '<template><div id="test" class="old-class"></div></template>';

    test('should extend attribute with space glue', () => {
      const expected = '<template><div id="test" class="old-class new-class"></div></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('div')
        .extendAttribute('class', 'new-class')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should extend attribute with custom glue', () => {
      const expected = '<template><div id="test" class="old-class xD new-class"></div></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('div')
        .extendAttribute('class', 'new-class', ' xD ')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should add attribute if it does not exist', () => {
      const expected = '<template><div id="test" class="old-class" data-why="test"></div></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('div')
        .extendAttribute('data-why', 'test')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should whork independent from finding method', () => {
      const expected = '<template><div id="test" class="old-class" data-why="test"></div></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByAttributeValue('id', 'test')
        .extendAttribute('data-why', 'test')
        .getTemplate();
      expect(result).toBe(expected);
      const result2 = new VueModifyTemplate()
        .fromTemplate(template)
        .findByAttribute('id')
        .extendAttribute('data-why', 'test')
        .getTemplate();
      expect(result2).toBe(expected);
    });

    test('should chain modifications', () => {
      const expected = '<template><div id="test" class="old-class a b"></div></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('div')
        .extendAttribute('class', 'a')
        .extendAttribute('class', 'b')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should work with vue attributes and components', () => {
      const template = '<template><nice-one id="test" :class="old-class" @click="go">OK</nice-one></template>';
      const expected = '<template><nice-one id="test" :class="old-class new-class" @click="go" @look="scare()">OK</nice-one></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('nice-one')
        .extendAttribute(':class', 'new-class')
        .extendAttribute('@look', 'scare()')
        // .extendAttribute('v-if', 'nice')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should work with single component', () => {
      const template = '<template><nice-one></nice-one></template>';
      const expected = '<template><nice-one :class="new-class"></nice-one></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('nice-one')
        .extendAttribute(':class', 'new-class')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should work with deep structure', () => {
      const template = '<template><nice-one><div><other/><br/></div></nice-one></template>';
      const expected = '<template><nice-one><div><other :class="new-class"/><br/></div></nice-one></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('other')
        .extendAttribute(':class', 'new-class')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should work with single tag', () => {
      const template = '<template><div></div></template>';
      const expected = '<template><div class="new-class"></div></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('div')
        .extendAttribute('class', 'new-class')
        .getTemplate();
      expect(result).toBe(expected);
    });

    test('should work with self closing tag', () => {
      const template = '<template><nice-one/></template>';
      const expected = '<template><nice-one :class="new-class"/></template>';
      const result = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('nice-one')
        .extendAttribute(':class', 'new-class')
        .getTemplate();
      expect(result).toBe(expected);
    });
  });

  describe('setAttribute', () => {
    it('replaces the value of an existing attribute', () => {
      const template = '<div class="foo" id="bar"></div>';
      const expected = '<div class="foo" id="baz"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('id').setAttribute('id', 'baz').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('adds a new attribute if it does not already exist', () => {
      const template = '<div class="foo"></div>';
      const expected = '<div class="foo" id="bar"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByTag('div').setAttribute('id', 'bar').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('does not modify the template if the attribute value is already set to the new value', () => {
      const template = '<div class="foo" id="bar"></div>';
      const expected = '<div class="foo" id="bar"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('id').setAttribute('id', 'bar').getTemplate();
      expect(result).toEqual(expected);
    });

    it('adds a new attribute to a self-closing tag', () => {
      const template = '<input type="text"/>';
      const expected = '<input type="text" id="foo"/>';
      const result = new VueModifyTemplate().fromTemplate(template).findByTag('input').setAttribute('id', 'foo').getTemplate();
      expect(result).toEqual(expected);
    });

    it('should set the value of an existing attribute in a multiline template', () => {
      const template = `
        <div
          class="my-class"
          data-testid="my-test-id"
        >
          <p
            id="my-id"
            data-value="old value"
          >
            This is a paragraph.
          </p>
        </div>
      `.trim();
      const expectedOutput = `
        <div
          class="my-class"
          data-testid="my-test-id"
        >
          <p
            id="my-id"
            data-value="new value"
          >
            This is a paragraph.
          </p>
        </div>
      `.trim();
      const actualOutput = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('p')
        .setAttribute('data-value', 'new value')
        .getTemplate();

      expect(actualOutput).toBe(expectedOutput);
    });
    
    // Currently not supported. The regexp needs to be modified to allow closing tag > in attributes. Not trivial.
    
    // it('adds an attribute to an element with Tailwind selector as a class', () => {
    //   const template = '<div class="[&>input]:underline"></div>';
    //   const expectedOutput = '<div class="[&>input]:underline" my-attribute="my value"></div>';
    //   const actualOutput = new VueModifyTemplate()
    //     .fromTemplate(template)
    //     .findByTag('div')
    //     .setAttribute('my-attribute', 'my value')
    //     .getTemplate();

    //   expect(actualOutput).toBe(expectedOutput);
    // });
    

    // it('adds an attribute to a self-closing element with Tailwind selector as a class', () => {
    //   const template = '<div class="[&>input]:underline" />';
    //   const expectedOutput = '<div class="[&>input]:underline" my-attribute="my value" />';
    //   const actualOutput = new VueModifyTemplate()
    //     .fromTemplate(template)
    //     .findByTag('div')
    //     .setAttribute('my-attribute', 'my value')
    //     .getTemplate();

    //   expect(actualOutput).toBe(expectedOutput);
    // });
  });
  
  describe('getAttributeValue', () => {
    it('gets the value of attribute', () => {
      const template = '<div class="m-10\np-10" id="bar"></div>';
      const expected = 'm-10\np-10';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('id').getAttributeValue('class');      
      expect(result).toEqual(expected);
      
    });

    it('gets the empty value of non set attribute', () => {
      const template = '<div id="bar"></div>';
      const expected = '';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('id').getAttributeValue('class');
      expect(result).toEqual(expected);      
    });
  });

  describe('reduceAttribute', () => {
    it('reduces the value of an existing attribute', () => {
      const template = '<div class="foo bar"></div>';
      const expected = '<div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('class').reduceAttribute('class', 'bar').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('removes the attribute if its value is reduced to an empty string', () => {
      const template = '<div class="foo"></div>';
      const expected = '<div></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('class').reduceAttribute('class', 'foo').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('ignores whitespace in the attribute value', () => {
      const template = '<div class="foo   bar   baz"></div>';
      const expected = '<div class="foo      baz"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('class').reduceAttribute('class', 'bar').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('does not modify the template if the attribute value does not contain the value to be reduced', () => {
      const template = '<div class="foo"></div>';
      const expected = '<div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('class').reduceAttribute('class', 'bar').getTemplate();
      expect(result).toEqual(expected);
    });
   });
  
   describe('removeAttribute', () => {
    it('removes an existing attribute', () => {
      const template = '<div class="foo" id="bar"></div>';
      const expected = '<div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('id').removeAttribute('id').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('does not modify the template if the attribute does not exist', () => {
      const template = '<div class="foo"></div>';
      const expected = '<div class="foo"></div>';
      const result = new VueModifyTemplate().fromTemplate(template).findByTag('div').removeAttribute('id').getTemplate();
      expect(result).toEqual(expected);
    });
  
    it('removes an attribute with a complex value', () => {
      const template = '<comp class="foo" :some="value1 value2"></comp>';
      const expected = '<comp class="foo"></comp>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttributeValue('class', 'foo').removeAttribute(':some').getTemplate();
      expect(result).toEqual(expected);
    });

    it('removes an attribute without value', () => {
      const template = '<comp some-attr></comp>';
      const expected = '<comp></comp>';
      const result = new VueModifyTemplate().fromTemplate(template).findByAttribute('some-attr').removeAttribute('some-attr').getTemplate();
      expect(result).toEqual(expected);
    });
  });

  describe('transformAttributeValue', () => {
    it('should transform the attribute value with the provided callback', () => {
      const template = '<div class="example"></div>';
      const vm = new VueModifyTemplate().fromTemplate(template).findFirst();

      vm.transformAttributeValue('class', (value) => value + ' new-class');

      expect(vm.getElementCode()).toBe('<div class="example new-class"></div>');
    });

    it('should remove the attribute if the callback returns null', () => {
      const template = '<div class="example"></div>';
      const vm = new VueModifyTemplate().fromTemplate(template).findFirst();

      vm.transformAttributeValue('class', () => null);

      expect(vm.getElementCode()).toBe('<div></div>');
    });
  });

  describe('regexpAttribute', () => {
    it('replaces attribute value with regular expression', () => {
      const template = '<some-component data-for="money"></some-component>';
      const result = new VueModifyTemplate().fromTemplate(template).findByTag('some-component').regexpAttribute('data-for', /mon/g, 'h').getTemplate();
      expect(result).toEqual('<some-component data-for="hey"></some-component>');
    });
  });

  describe('other features', () => {
    it('shall be possible to move around with multiple finds', () => {
      const vm = new VueModifyTemplate();
    
      const template = '<div><p class="foo">Hello world</p><p class="bar">Hello again</p></div>';
      const expectedOutput = '<div><p>Hello world</p><p class="bar baz">Hello again</p></div>';
    
      const output = vm.fromTemplate(template)
        .findByTag('p')
        .removeAttribute('class')
        .findByAttributeValue('class', 'bar')
        .extendAttribute('class', 'baz')
        .getTemplate();
    
      expect(output).toBe(expectedOutput);
    });
  });

  describe('removeElement', () => {
    it('removes the element from the template', () => {
      const expectedTemplate = trimMultilineString(`
        <template>
          <div class="container">

            <component/>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template).findByTag('h1').removeElement();
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });
  });

  describe('insertBefore', () => {
    it('inserts HTML before the element', () => {
      const expectedTemplate = trimMultilineString(`
        <template>
          <div class="container">
            <h2>Greetings, earthlings!</h2><h1>Hello, world!</h1>
            <component/>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template).findByTag('h1').insertBefore('<h2>Greetings, earthlings!</h2>');
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });
  });

  describe('insertAfter', () => {
    it('inserts HTML after the element', () => {
      const expectedTemplate = trimMultilineString(`
        <template>
          <div class="container">
            <h1>Hello, world!</h1><h2>Greetings, earthlings!</h2>
            <component/>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template).findByTag('h1').insertAfter('<h2>Greetings, earthlings!</h2>');
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });

    it('inserts HTML after the self closing element', () => {
      const expectedTemplate = trimMultilineString(`
        <template>
          <div class="container">
            <h1>Hello, world!</h1>
            <component/><h2>Greetings, earthlings!</h2>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template).findByTag('component').insertAfter('<h2>Greetings, earthlings!</h2>');
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });
  });

  describe('unwrap', () => {
    it('replaces the element with its inner HTML', () => {
      const expectedTemplate = trimMultilineString(`
        <template>

            <h1>Hello, world!</h1>
            <component/>
            <p>Lorem ipsum dolor sit amet.</p>

        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template).findByTag('div').unwrap();
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });
    it('works like remove for self closing tags', () => {
      const expectedTemplate = trimMultilineString(`
        <template>
          <div class="container">
            <h1>Hello, world!</h1>

            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template).findByTag('component').unwrap();
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });

  });

  describe('insertInside', () => {
    it('should insert HTML into the element', () => {
      const expected = trimMultilineString(`
        <template>
          <div class="container">
            <h1>Hello, world!</h1>
            <component/>
            <p>Lorem ipsum dolor sit amet.<strong>bold text</strong></p>
          </div>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template).findByTag('p').insertInside("<strong>bold text</strong>");
      const result = modifier.getTemplate();
      expect(result).toBe(expected);
    });

    it('does not support self closing tags', () => {            
      expect(()=>{
        const modifier = new VueModifyTemplate().fromTemplate(trimMultilineString(template, false)).findByTag('component').insertInside("<strong>bold text</strong>");
        modifier.getTemplate();
      }).toThrowError("insertInside does not support self closing tags");
    });
  });

  describe('getElementCode', () => {
    it('returns the code for the selected element', () => {
      const template = `
        <div>
          <p>Hello</p>
          <span>world</span>
        </div>
      `;
      const modifier = new VueModifyTemplate();
      const element = modifier.fromTemplate(template).findByTag('p');
      const code = element.getElementCode();
  
      expect(code).toEqual('<p>Hello</p>');
    });
  });  

  describe('renameElement', () => {
    it('should rename a simple element', () => {
      const vm = new VueModifyTemplate()
        .fromTemplate('<div>Hello world</div>')
        .findByTag('div')
        .renameElement('span')
        .getTemplate();
      expect(vm).toBe('<span>Hello world</span>');
    });

    it('should rename an element with attributes', () => {
      const vm = new VueModifyTemplate()
        .fromTemplate('<div class="my-class" data-id="123">Hello world</div>')
        .findByTag('div')
        .renameElement('span')
        .getTemplate();
      expect(vm).toBe('<span class="my-class" data-id="123">Hello world</span>');
    });

    it('should rename a self-closing element', () => {
      const vm = new VueModifyTemplate()
        .fromTemplate('<img src="image.jpg" alt="My Image"/>')
        .findByTag('img')
        .renameElement('picture')
        .getTemplate();
      expect(vm).toBe('<picture src="image.jpg" alt="My Image"/>');
    });

    it('should rename nested element', () => {
      const template = '<div><span></span></div>';
      const expectedOutput = '<div><div></div></div>';
      const actualOutput = new VueModifyTemplate()
        .fromTemplate(template)
        .findByTag('span')
        .renameElement('div')
        .getTemplate();

      expect(actualOutput).toBe(expectedOutput);
    });

    // Currently not supported. The regexp needs to be modified to allow closing tag > in attributes. Not trivial.

    // it('should rename an element with Tailwind selector as a class', () => {
    //   const template = '<div class="[&>input]:underline"></div>';
    //   const expectedOutput = '<span class="[&>input]:underline"></span>';
    //   const actualOutput = new VueModifyTemplate()
    //     .fromTemplate(template)
    //     .findByTag('div')
    //     .renameElement('span')
    //     .getTemplate();

    //   expect(actualOutput).toBe(expectedOutput);
    // });

    // it('should rename a self-closing element with Tailwind selector as a class', () => {
    //   const template = '<div class="[&>input]:underline" />';
    //   const expectedOutput = '<span class="[&>input]:underline" />';
    //   const actualOutput = new VueModifyTemplate()
    //     .fromTemplate(template)
    //     .findByTag('div')
    //     .renameElement('span')
    //     .getTemplate();

    //   expect(actualOutput).toBe(expectedOutput);
    // });
  });

  describe('possibility to wrap', () => {
    it('shall be possible to wrap few elements', () => {
      const template = trimMultilineString(`
        <template>
          <h1>Hello, world!</h1>
          <component/>
        </template>
      `);
      const expectedTemplate = trimMultilineString(`
        <template>
          <div class="container"><h1>Hello, world!</h1>
          <component/></div>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template)
        .findByTag('h1')
        .insertBefore('<div class="container">')
        .findByTag('component')
        .insertAfter('</div>');
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });

  });

  describe('chaining', () => {
    it('shall be possible to wrap few elements', () => {
      const template = trimMultilineString(`
        <template>
          <h1>Hello, world!</h1>
          <component/>
        </template>
      `);
      const expectedTemplate = trimMultilineString(`
        <template>
          <div class="container"><h1 id="headline">Hello, world!</h1></div>
          <component/>
        </template>
      `);
      const modifier = new VueModifyTemplate().fromTemplate(template)
        .findByTag('h1')
        .insertBefore('<div class="container">')
        .setAttribute('id', 'headline')
        .insertAfter('</div>');
      const modifiedTemplate = modifier.getTemplate();
      expect(modifiedTemplate).toBe(expectedTemplate);
    });

  });

});
