# Kombinator

**Kombinator** is a set of build plugins that combines a Nuxt 3 base project and a customization layer into a fully functional product. It is designed to streamline the process of creating customized versions of a Nuxt 3 application.

To use the tool, developers first create or obtain the Nuxt 3 base project, which serves as the foundation for all customized versions. They then create a customization layer that includes any necessary modifications or additions to the base project. This might include changes to the user interface, business logic, or integration with other systems.

Once the base project and customization layer are created, the tool combines them into a single, fully functional product. This can be done through a process of merging the two codebases, compiling the resulting code, and generating any necessary configuration files or deployment scripts.

The resulting product is then ready for testing and deployment, either on a local machine or in a production environment. The customization layer can be easily swapped out or modified as needed, allowing for rapid iteration and customization of the underlying Nuxt 3 application.


# API - VUE - functions you can use in mod files

#### `fromTemplate(template: string)`

Sets the template to be modified.

#### `getTemplate(): string`

Gets the modified template.

## Finding element (tag)

Before modifying elements you need to find proper element with simplified selectors.

#### `findByTag(tagName: string)`

Finds the first element with given tag

#### `findByAttribute(name: string)`

Finds the first tag in the template with given attribute

#### `findByAttributeValue(name: string, value: string)`

Finds the first tag in the template with given attribute having given value

#### `findFirst(): VueElementFinder`

Finds first element in the template

## Modification of attributes

#### `removeAttribute(name: string)`

Removes an attribute with the given `name` from the HTML element found by `find*()`. 

#### `reduceAttribute(name: string, value: string)`

Reduces the value of an attribute with the given `name` by removing the given `value` from it. 

#### `regexpAttribute(name: string, regexp: RegExp, replace: string)`

Replaces the value of an attribute with the given `name` by applying the given regular expression `regexp` and replacement `replace` on it.

#### `extendAttribute(name: string, value: string, glue = ' ')`

Extends the value of an attribute with the given `name` by appending the given `value` to it with the given `glue` separator. If the attribute does not exist, it will be added to the HTML element. 

#### `transformAttributeValue(name: string, callback: AttributeTransformer)`

The method is used to modify the value of an attribute of an element using a callback function.

- `callback` (AttributeTransformer): A function that takes the current value of the attribute as input and returns either a new value or `null` if the attribute should be removed

#### `setAttribute(name: string, value: string)`

Sets the value of an attribute with the given `name` to the given `value`. If the attribute already exists, its value will be replaced. Otherwise, the attribute will be added to the HTML element.

#### `getAttributeValue(name: string, value: string): string`

Gets the value of an attribute with the given `name`. If the attribute does not exist, its value will be "". Usefull for optimization of  classes, e.g. with tailwind-merge.

### Example Usage

```javascript
import { VueModifyTemplate } from "@creativestyle/kombinator";

const code = `
  <div class="foo" id="bar" v-if="isTrue" v-for="item in items">{{ item }}</div>
`;

const modifier = new VueModifyTemplate(code);

modifier
  .findByTag('div')
  .removeAttribute('id')
  .reduceAttribute('class', 'foo')
  .regexpAttribute('v-if', /isTrue/g, 'show')
  .extendAttribute('class', 'baz')
  .setAttribute('data-foo', 'bar');

const modifiedCode = modifier.getModifiedCode();
console.log(modifiedCode);

// Output:
// <div class="baz" v-show="true" v-for="item in items" data-foo="bar">{{ item }}</div>
```
## Modification of tags

#### `removeElement()`

Removes the entire element (including its contents) currently selected by the class instance.

#### `renameElement(newTagName: string)`

Renames the tag name of the element currently selected by the class instance to `newTagName`.

#### `insertBefore(html: string)`

Inserts the HTML code `html` before the element currently selected by the class instance.

#### `insertAfter(html: string)`

Inserts the HTML code `html` after the element currently selected by the class instance.

#### `unwrap()`

Removes the current element's tag but retains its contents.

#### `getElementCode(): string`

Returns the HTML code for the element currently selected by the class instance.

#### `insertInside(html: string)`

Inserts the HTML code `html` inside the element currently selected by the class instance.

### Usage

```javascript
import { VueModifyTemplate } from "@creativestyle/kombinator";

const template = `
  <template>
    <div id="main">
      <p>Hello world</p>
    </div>
  </template>
`;

const vm = new VueModifyTemplate();
vm.fromTemplate(template)
  .findByTag("div")
  .renameElement("section")
  .insertAfter("<p>New element</p>")
  .findByAttribute("id")
  .insertBefore('<span>');
  .insertAfter('</span><some-component :foo="ok"/>');
const modifiedTemplate = vm.getTemplate();
console.log(modifiedTemplate);

// Output: 
// <template>
//   <span><section id="main">
//     <p>Hello world</p><p>New element</p>
//   </section></span><some-component :foo="ok"/>
// </template>
```

# API - GRAPHQL - functions you can use in mod files

#### `fromString(content: string)`

Sets the graphql to be modified.

#### `getString(): string`

Gets the modified graphql.

## Finding field

Before modifying graphql you need to find proper field by define its path

#### `findField(fieldPath: string[])`

Finds the field based on path. Each array item is another nested field in graphql file.

## Modification of fields

#### `addFields(fieldsToAdd: string[])`

Adds fields or spread fragments to active field.

#### `removeFields(fieldsToRemove: string[])`

Remove fields or spread fragments to active field.

### Usage

```javascript
import { GraphqlModificator } from "@creativestyle/kombinator";

const graphql = `
  query HelloWorld {
    queryName {
      field
    }
  }
`;

const gm = new GraphqlModificator();
gm.fromString(graphql)
  .findField(['queryName'])
  .removeFields(['field'])
  .addFields(['anotherField', '...someFragment']);
const modifiedTemplate = gm.getString();
console.log(modifiedTemplate);

// Output: 
// query HelloWorld {
//   queryName {
//     anotherField
//     ...someFragment
//   }
// }
```

## Modification of variables

#### `addVariable(variableName: string, variableType: string, hardcodedValue: string | null = null)`

Adds variable assigned to a field. Dynamic variable by default. Hardcoded when `hardcodedValue` is provided.

#### `removeVariable(variableName: string)`

Removes variable assigned to a field.

### Usage

```javascript
import { GraphqlModificator } from "@creativestyle/kombinator";

const graphql = `
  query HelloWorld {
    queryName {
      field (sort: "ASC") {
        nestedField
      }
    }
  }
`;

const gm = new GraphqlModificator();
gm.fromString(graphql)
  .findField(['queryName', 'field'])
  .removeVariable('sort')
  .findField(['queryName', 'field', 'nestedField'])
  .addVariable('type', 'String')
const modifiedTemplate = gm.getString();
console.log(modifiedTemplate);

// Output: 
// query HelloWorld($type: String) {
//   queryName {
//     field {
//       nestedField(type: $type)
//     }
//   }
// }
```

# History associated with the name

The Polish word *kombinator* refers to a person who is crafty, resourceful, and skilled at finding solutions to problems through creative thinking, often using unconventional or cunning methods. It can have a slightly negative connotation and may be used to describe someone who is overly scheming or manipulative.

During the Polish People's Republic (PRL) era, which lasted from 1947 to 1989, the country was under communist rule and faced many economic and social challenges. The government controlled most aspects of daily life, including education, media, and the economy.

Under such a system, being a *kombinator* was often necessary for survival. People had to find creative ways to obtain scarce goods and services, navigate the complex bureaucracy, and make ends meet. Many faced shortages of basic necessities, such as food, housing, and clothing, and had to resort to various strategies to acquire them.

Additionally, the government often interfered in people's personal lives, limiting their freedoms and restricting their ability to pursue their goals. Being a *kombinator* allowed individuals to find ways to circumvent these restrictions and pursue their interests and ambitions.

Therefore, being a *kombinator* was often necessary during the PRL times to navigate the challenging economic and social conditions and to find ways to improve one's quality of life.

# Other things

## Known limitations

There are a few challenges that were not able to solve now. Feel free to contribute!
- This file watches changes only on existing .mod.ts files, if you add .mod.ts file you need to restart your dev/watch process. 

### Why this plugin duplicates some features of other plugins

This plugin has some *minor functions* that can be achieved also by plugins like rollup-plugin-copy, but:
- that plugin seems to be not maintained - many merge requests are not merged for months.
- We need only a small subset of functionalities, and we do not want to pull a huge pile of dependencies.
- At some point if those alternative plugins will be better maintained we will kick out this functionality from here.

The main purpose of this plugin is to deliver convenient API for automated modification/patching of the base project, not copying files around.

### Chapeau bas to AI
*Parts of this plugin its documentation and tests are written with the support of Chat GPT3.5*