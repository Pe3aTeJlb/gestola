/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    extends: [
        './configs/base.eslintrc.json'
    ],
    ignorePatterns: [
        '**/{node_modules,lib}',
        'plugins'
    ],
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.json'
    }
};
