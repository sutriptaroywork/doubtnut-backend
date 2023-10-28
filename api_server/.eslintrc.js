module.exports = {
    env: {
        commonjs: true,
        es6: true,
        mocha: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        beforeAll: true,
        expect: true,
        jest: true,
    },
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2018,
    },
    rules: {
        indent: ['error', 4, { SwitchCase: 1 }],
        'no-tabs': 0,
        'consistent-return': 0,
        'no-console': 0,
        'no-plusplus': 0,
        'max-len': 0,
        'no-continue': 0,
        eqeqeq: 1,
        'no-param-reassign': 0,
        'no-underscore-dangle': 0,
        'prefer-destructuring': ['error', {
            VariableDeclarator: {
                array: false,
                object: true,
            },
            AssignmentExpression: {
                array: false,
                object: false,
            },
        }],
        radix: ['error', 'as-needed'],
        'no-control-regex': 0,
        camelcase: 1,
        'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    },
};
