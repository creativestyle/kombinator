import fs from 'fs';
import temp from 'temp';
import { VueCombinedTagLoader } from '../src/VueCombinedTagLoader';

describe('VueCombinedTagLoader', () => {
  let componentSrcPath: string;
  let componentModPath: string;

  beforeEach(() => {
    // Create temporary test files
    componentSrcPath = temp.path({ suffix: '.vue' });
    componentModPath = temp.path({ suffix: '.vue' });

    fs.writeFileSync(componentSrcPath, '<template><div class="test">Hello world!</div></template><script>console.log(1);</script><style>.test { color: red; }</style>');
    fs.writeFileSync(componentModPath, '<script>console.log(2);</script><style>.test { color: blue; }</style>');
  });

  afterEach(() => {
    // Remove temporary test files
    fs.unlinkSync(componentSrcPath);
    fs.unlinkSync(componentModPath);
  });

  test('should combine script and style tags from component source and mod files', () => {
    const loader = new VueCombinedTagLoader();
    loader.loadComponent(componentSrcPath, componentModPath);

    const result = loader.getCode();
    expect(result).toBe('<template><div class="test">Hello world!</div></template><script>console.log(1);\nconsole.log(2);</script><style>.test { color: red; }\n.test { color: blue; }</style>');
  });

  test('should combine style tag in component source with style tag from component mod', () => {
    const loader = new VueCombinedTagLoader();
    loader.setTag(['style']);
    loader.loadComponent(componentSrcPath, componentModPath);

    const result = loader.getCode();
    expect(result).toBe('<template><div class="test">Hello world!</div></template><script>console.log(1);</script><style>.test { color: red; }\n.test { color: blue; }</style>');
  });

  test('should replace style tag in component source with style tag from component mod', () => {
    const loader = new VueCombinedTagLoader();
    loader.setTag(['style', 'script']);
    const componentModPath2 = temp.path({ suffix: '.vue' });
    fs.writeFileSync(componentModPath2, '<script>console.log(2);</script><style kombinator="replace">.test { color: blue; }</style>');
    loader.loadComponent(componentSrcPath, componentModPath2);
    fs.unlinkSync(componentModPath2);

    const result = loader.getCode();
    expect(result).toBe('<template><div class="test">Hello world!</div></template><script>console.log(1);\nconsole.log(2);</script><style>.test { color: blue; }</style>');
  });
  
});
