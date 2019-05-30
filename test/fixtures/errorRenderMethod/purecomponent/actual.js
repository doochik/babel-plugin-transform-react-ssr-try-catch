const { PureComponent } = require('react');

class TestComponent extends PureComponent {
    render() {
        return <div/>;
    }

    ERRORBOUNDARY_render() {
        return <span>oops!</span>;
    }
}

module.exports = TestComponent;
