const React = require('react');

class TestComponent extends React.Component {
    render() {
        return <div/>;
    }

    ERRORBOUNDARY_render() {
        return <span>oops!</span>;
    }
}

module.exports = TestComponent;
