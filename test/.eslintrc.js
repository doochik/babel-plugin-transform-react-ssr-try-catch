module.exports = {
    env: {
        mocha: true
    },
    overrides: [
        {
            files: [ 'expected.js' ],
            "rules": {
                "quotes": "off",
            }
        },
    ]
};
