# eslint-plugin-react-useeffect-cleanup

An ESLint plugin to enforce proper cleanup functions in React useEffect/useLayoutEffect hooks.

## Description

This ESLint plugin contains a rule that ensures all returns inside the callback function of `useEffect` or `useLayoutEffect` return a function. If the return statement does not return a function (for example, an empty return or a non-function value), an error is reported.

By enforcing this rule, you can prevent unintended behaviors that might occur when a `useEffect` or `useLayoutEffect` fails to properly return a cleanup function on unmount.

## Installation

Install the plugin as a development dependency using package manager:

```bash
npm install --save-dev eslint-plugin-react-useeffect-cleanup
# or
yarn add --dev eslint-plugin-react-useeffect-cleanup
# or
pnpm install --dev eslint-plugin-react-useeffect-cleanup
```

## Usage

After installing, add the plugin to your ESLint configuration. For example, if you use a JavaScript or TypeScript configuration file, you can add it as follows:

```js
// Example .eslintrc.js

import reactUseEffect from 'eslint-plugin-react-useeffect'

module.exports = {
  plugins: { 'react-use-effect': reactUseEffect },
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'react-use-effect/no-non-function-return': 'error',
  },
};
```

## Example

### Incorrect Code

```jsx
import { useEffect } from 'react';

function MyComponent({ a, b }) {
  useEffect(() => {
    if (a) {
      return; // ❌ Error: returns undefined instead of a cleanup function.
    }

    return () => { clearInterval(b); }; // Correct usage
  }, [a, b]);

  return <div>Example</div>;
}
```

### Auto-Fix Suggestion

When a violation is detected, the plugin suggests replacing the incorrect return with the default cleanup function:

```jsx
return () => {};
```

## Auto-fix and Suggestions

This plugin supports auto-fixing and suggestion messages. When an incorrect return is found, ESLint will display a suggestion message such as:

- **Suggestion:** "Replace with a cleanup function `() => {}`"

Upon applying the auto-fix, the rule automatically replaces the faulty return value with the cleanup function template. You can then modify the cleanup function as needed.

## Contributing

Contributions, bug reports, and feature requests are welcome. Please submit an issue or pull request on the GitHub repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.