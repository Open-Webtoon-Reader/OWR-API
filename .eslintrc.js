module.exports = {
    parserOptions: {
        esmaVersion: "latest",
        sourceType: "module"
    },
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint"
    ],
    extends: [
        "plugin:@typescript-eslint/recommended",
    ],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    rules: {
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "indent": [
            "error", 4,
            {
                "SwitchCase": 1
            }
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "eol-last": [
            "error",
            "always"
        ],
        "object-curly-spacing": [
            "error",
            "never"
        ],
        "no-undef": [
            "off"
        ],
        "func-style": [
            "error",
            "declaration"
        ],
        "array-bracket-spacing": [
            "error",
            "never"
        ],
        "space-infix-ops": [
            "error"
        ],
        "space-before-function-paren": [
            "error",
            "never"
        ],
        "space-in-parens": [
            "error",
            "never"
        ],
        "space-before-blocks": [
            "error",
            "never"
        ]
    },
};
