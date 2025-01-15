const React = require('react');

class TestComponent extends React.PureComponent {
    render() {
        return <span/>;
    }
}

class TestExtendsComponent extends TestComponent {

    render() {
        return (
            <div>{super.render()}</div>
        );
    }
}

module.exports = TestExtendsComponent;
