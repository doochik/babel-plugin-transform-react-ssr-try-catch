const ReactSSRErrorHandler = require("./path/to/my/SSRErrorHandler.js");

const React = require('react');

class TestComponent extends React.PureComponent {
  render() {
    try {
      return this.__originalRenderMethod__();
    } catch (e) {
      return ReactSSRErrorHandler(e, this.constructor.name);
    }
  }

  __originalRenderMethod__() {
    return <div />;
  }

}

module.exports = TestComponent;
