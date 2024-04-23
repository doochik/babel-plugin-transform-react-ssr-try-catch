import ReactSSRErrorHandler from "./path/to/my/SSRErrorHandler.js";
import { Component } from 'react';
class TestComponent extends Component {
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
export default TestComponent;
