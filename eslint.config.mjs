import stylistic from "@stylistic/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

export default [
    {
        ignores: ["dist/"],
    },
    stylistic.configs["recommended-flat"],
    {
        plugins: {
            "@stylistic": stylistic,
        },
        languageOptions: {
            parser: parserTs,
        },
        files: ["**/*.ts", "**/*.js", "**/*.mjs"],

        rules: {
            "@stylistic/interface-name-prefix": "off",
            "@stylistic/explicit-function-return-type": "off",
            "@stylistic/explicit-module-boundary-types": "off",
            "@stylistic/no-explicit-any": "off",
            "@/lines-between-class-members": [
                "error",
                {
                    enforce: [
                        {
                            blankLine: "always",
                            prev: "field",
                            next: "method",
                        },
                    ],
                },
            ],
            "@/no-unused-vars": [
                "error",
                {
                    caughtErrorsIgnorePattern: "^_",
                    argsIgnorePattern: "^_|Service$",
                },
            ],
            "@stylistic/brace-style": [
                "error",
                "1tbs",
            ],
            "@stylistic/keyword-spacing": [
                "error",
                {
                    overrides: {
                        if: {
                            before: false,
                            after: false,
                        },
                        else: {
                            before: false,
                            after: false,
                        },
                        for: {
                            before: false,
                            after: false,
                        },
                        while: {
                            before: false,
                            after: false,
                        },
                        do: {
                            before: false,
                            after: false,
                        },
                        try: {
                            before: false,
                            after: false,
                        },
                        catch: {
                            before: false,
                            after: false,
                        },
                        finally: {
                            before: false,
                            after: false,
                        },
                    },
                    before: true,
                    after: true,
                },
            ],
            "@stylistic/member-delimiter-style": [
                "error",
                {
                    multiline: {
                        delimiter: "semi",
                        requireLast: true,
                    },
                    singleline: {
                        delimiter: "semi",
                        requireLast: true,
                    },
                },
            ],
            "@stylistic/indent": [
                "error", 4,
            ],
            "@stylistic/quotes": [
                "error",
                "double",
            ],
            "@stylistic/semi": [
                "error",
                "always",
            ],
            "@stylistic/eol-last": [
                "error",
                "always",
            ],
            "@stylistic/object-curly-spacing": [
                "error",
                "never",
            ],
            "@stylistic/no-undef": [
                "off",
            ],
            "@/func-style": [
                "error",
                "declaration",
            ],
            "@stylistic/array-bracket-spacing": [
                "error",
                "never",
            ],
            "@stylistic/space-infix-ops": [
                "error",
            ],
            "@stylistic/space-before-function-paren": [
                "error",
                "never",
            ],
            "@stylistic/space-in-parens": [
                "error",
                "never",
            ],
            "@stylistic/space-before-blocks": [
                "error",
                "never",
            ],
        },
    },
];
