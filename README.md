[![Build Status](https://travis-ci.org/doochik/babel-plugin-transform-react-ssr-try-catch.svg?branch=master)](https://travis-ci.org/doochik/babel-plugin-transform-react-ssr-try-catch)

# @doochik/babel-plugin-transform-react-ssr-try-catch

Babel plugin to wrap render() method in React.Component with try-catch statement.

## Motivation

React 16 has [error handling](https://reactjs.org/blog/2017/09/26/react-v16.0.html#better-error-handling) but for [client rendering only](https://github.com/facebook/react/issues/10442). 

This plugin performs simple transform which wraps every render() method with try-catch.
Example:
```js
// MyComponent.js

class MyCompoenent extends React.PureComponent {
  render() {
    return <div/>;
  }
}
```

This component will be transofmed to:
```js
// MyComponent.js
const ReactSSRErrorHandler = require('./path/to/my/SSRErrorHandler.js');

class MyCompoenent extends React.PureComponent {
  render() {
      try {
          return this.__originalRenderMethod__();
      } catch (e) {
          return ReactSSRErrorHandler(e, this.constructor.name, this);
      }
  }

  __originalRenderMethod__() {
      return <div />;
  }
}
```

Actually, this is temporary solution until React doesn't support error handling in SSR.

## Installation

```sh
npm install --save-dev @doochik/babel-plugin-transform-react-ssr-try-catch
```

## Usage

**You should enable this plugin only for server build. Use React 16 error boundaries from client build.**

**.babelrc**

```json
{
    "plugins": [
        ["react-ssr-try-catch", {
            // global errorHandler
            "errorHandler": "./path/to/my/SSRErrorHandler.js",
            // component error render method
            "errorRenderMethod": "renderErrorState",
            "type": "module"
        }]
    ]
}
```

## Options

### `type`

To generate ESM imports add option `type='module'`


### `errorHandler`

Path to your errorHandler module.
This is simple function with three arguments `(error, componentName, componentContext)`

```js
// SSRErrorHandler.js

module.exports = (error, componentName, componentContext) => {
   // here you can log error and return fallback component or null.
}
```

### `errorRenderMethod`

Component method name to render error state
Method invokes with two arguments `(error, componentName)`

```js
// original component

class TestComponent extends React.PureComponent {
    render() {
        return <div/>;
    }

    renderErrorState() {
        return <p>oops!</p>;
    }
}

// component after transformation
class TestComponent extends React.PureComponent {
    render() {
        try {
            return this.__originalRenderMethod__();
        } catch (e) {
            return this.renderErrorState(e, this.constructor.name);
        }
    }

    renderErrorState() {
        return <p>oops!</p>;
    }

    __originalRenderMethod__() {
        return <div />;
    }
}
```
