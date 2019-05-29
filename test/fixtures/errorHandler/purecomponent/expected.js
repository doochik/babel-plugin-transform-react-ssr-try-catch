const ReactSSRErrorHandler = require('./path/to/my/SSRErrorHandler.js');

const { PureComponent } = require('react');

class TestComponent extends PureComponent {
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
