const { Component } = require('react');

class TestComponent extends Component {
    render() {
        return <div/>;
    }

    ERRORBOUNDARY_render() {
        return <span>oops!</span>;
    }
}

module.exports = TestComponent;
