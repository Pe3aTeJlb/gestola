/**
 * This file can be edited to customize webpack configuration.
 * To reset delete this file and rerun theia build again.
 */
// @ts-check
const configs = require('./gen-webpack.config.js');
const nodeConfig = require('./gen-webpack.node.config.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin')
const path = require('path');
const resolvePackagePath = require('resolve-package-path');
const webpack = require('webpack');


/**
 * Expose bundled modules on window.theia.moduleName namespace, e.g.
 * window['theia']['@theia/core/lib/common/uri'].
 * Such syntax can be used by external code, for instance, for testing.
configs[0].module.rules.push({
    test: /\.js$/,
    loader: require.resolve('@theia/application-manager/lib/expose-loader')
}); */

if (process.platform !== 'win32') {
    // For some reason, blueprint wants to bundle the `.node` files directly without going through `@vscode/windows-ca-certs`
    nodeConfig.ignoredResources.add('@vscode/windows-ca-certs/build/Release/crypt32.node');
}

// Copy example resources
const plugins = [
    new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer']
    }),
    new CopyWebpackPlugin({
        patterns: [
            {
                // copy examples to resource folder
                from: path.join(resolvePackagePath('@gestola/project-manager', __dirname), '..', 'resources'),
                to: path.resolve(__dirname, 'resources')
            }
        ]
    }),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.join(resolvePackagePath('@gestola/openfpgaloader', __dirname), '..', 'resources'),
                to: path.join(__dirname, 'lib/frontend')
            }
        ]
    }),
    new RemovePlugin({
        after: {
            root: './resources/templates',
            test: [
                {
                    folder: './empty',
                    method: (absoluteItemPath) => {
                        return new RegExp(/\.gitkeep/, 'm').test(absoluteItemPath);
                    },
                    recursive: true
                }
            ]
        }
    }),
    new RemovePlugin({
        after: {
            test: [
                {
                    folder: path.resolve(__dirname, 'resources'),
                    method: (absoluteItemPath) => {
                        return new RegExp(/^.*\.gz$/).test(absoluteItemPath);
                    },
                    recursive: true
                }
            ]
        }
    })
]

configs[0].plugins?.push(...plugins);
configs[0].resolve?.extensions.push(".jsx");
configs[1].resolve?.extensions.push(".jsx");
Object.assign(configs[0].resolve.fallback, {
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "util": require.resolve("util/"),
    "process": require.resolve("process/browser.js"),
    "assert": require.resolve("assert/"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "url": require.resolve("url/"),
    "zlib": require.resolve("browserify-zlib"),
    "fs": false,
    "net": false,
    "tls": false

});
Object.assign(configs[1].resolve.fallback, {
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "util": require.resolve("util/"),
    "process": require.resolve("process/browser.js"),
    "assert": require.resolve("assert/"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "url": require.resolve("url/"),
    "zlib": require.resolve("browserify-zlib"),
    "fs": false,
    "net": false,
    "tls": false
});
nodeConfig.config.module?.rules?.push(
    {
        test: /\.sh$/,
        use: "ignore-loader",
    },
);
nodeConfig.config.ignoreWarnings?.push(
    {
        module: /@node/
    }
);

Object.assign(nodeConfig.config.externals, {
    electron: 'require("electron")',
    vscode: 'commonjs vscode',
    '@serialport/bindings-cpp': 'commonjs @serialport/bindings-cpp',
    'applicationinsights-native-metrics': 'commonjs applicationinsights-native-metrics'
});



nodeConfig.nativePlugin.nativeBinding("better_sqlite3.node", "better-sqlite3/build/Release/better_sqlite3.node");

module.exports = [
    ...configs,
    nodeConfig.config,
];