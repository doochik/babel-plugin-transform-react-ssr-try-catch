const ReactSSRErrorHandler = require("./path/to/my/SSRErrorHandler.js");
const React = require('react');
class TestComponent extends React.PureComponent {
  render() {
    try {
      return this.__originalRenderMethod__();
    } catch (e) {
      return ReactSSRErrorHandler(e, this.constructor.name, this);
    }
  }
  __originalRenderMethod__() {
    return <span />;
  }
}
class TestExtendsComponent extends TestComponent {
  render() {
    return <div>{super.render()}</div>;
  }
}
module.exports = TestExtendsComponent;
