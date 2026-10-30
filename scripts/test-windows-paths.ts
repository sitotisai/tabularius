// Loaded with `node --import` by every Node process a test run starts on Windows (npm run test:ci sets NODE_OPTIONS).
//
// Many tests run a piece of code in a child process, `node --input-type=module -e "import { x } from 'D:\\..\\src\\a.ts'"`.
// Node's module loader reads a `D:` in front as a URL scheme and refuses it, where a `/home/...` path just works.
// This turns such a specifier into a file URL before it is resolved; any other specifier passes through.
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';

export const driveLetterPath = (specifier: string): boolean => /^[A-Za-z]:[\\/]/.test(specifier);
export const asSpecifier = (specifier: string): string => (driveLetterPath(specifier) ? pathToFileURL(specifier).href : specifier);

if (process.platform === 'win32') {
  // Only for `import`: a `require('D:\\x.cjs')` takes the path as it is, and would not find a file called file:///D:/x.cjs.
  registerHooks({ resolve: (specifier, context, next) => next(context.conditions?.includes('import') ? asSpecifier(specifier) : specifier, context) });
}
