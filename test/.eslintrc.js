module.exports = {
    "env": {
        "mocha": true
    },
    "plugins": [
        "mocha"
    ],
    "rules": {
        'mocha/no-exclusive-tests': "warn",
        'mocha/no-pending-tests': "warn",
        'mocha/no-skipped-tests': "warn",
        'mocha/handle-done-callback': "error",
        'mocha/no-synchronous-tests': "off",
        'mocha/no-global-tests': "error",
        'mocha/no-return-and-callback': "error",
        'mocha/valid-test-description': "off",
        'mocha/valid-suite-description': "error",
        'mocha/no-mocha-arrows': "error",
        'mocha/no-hooks': "off",
        'mocha/no-hooks-for-single-case': "error",
        'mocha/no-sibling-hooks': "error",
        'mocha/no-top-level-hooks': "error",
        'mocha/no-identical-title': "error",
        'mocha/max-top-level-suites': "warn",
        'mocha/no-nested-tests': "error",
        'mocha/no-setup-in-describe': "off",
        'mocha/prefer-arrow-callback': "off",
        'mocha/no-async-describe': "error",
        'prefer-arrow-callback': "off"
    }
}