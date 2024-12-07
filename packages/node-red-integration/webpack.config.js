/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
const path = require('path');
const buildRoot = path.resolve(__dirname, 'lib');
const appRoot = path.resolve(__dirname, 'dist');

/**@type {import('webpack').Configuration}*/
module.exports = env => { 
    return {
        context: env.mode === 'prod' ? undefined : path.resolve(__dirname, '../../electron-app'),
        entry: [path.resolve(buildRoot, 'app')],
        output: {
            filename: 'node-red-integration.js',
            path: appRoot,
            globalObject: 'this',
            library: {
              name: 'nodeRedServer',
              type: 'umd',
            },
        },
        node: {
            __dirname: env.mode === 'prod' ? true : true 
        },
        mode: 'development',
        devtool: 'source-map',
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            modules: ['../node_modules', 'node_modules'],
        },
        target: 'node',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: ['source-map-loader'],
                    enforce: 'pre',
                },
                {
                    test: /\.sh$/,
                    use: "ignore-loader",
                },
                {
                    test: /\.node$/,
                    loader: "node-loader",
                },
                {
                    test: /node_modules[\/](jsonc-parser)/,
                    loader: 'umd-compat-loader'
                }
            ]
        },
        ignoreWarnings: [
            // Some packages do not have source maps, that's ok
            /Failed to parse source map/,
            // Some packages use dynamic requires, we can safely ignore them (they are handled by the native webpack plugin)
            /require function is used in a way in which dependencies cannot be statically extracted/,
            /Can't resolve .* in '.*ws\/lib'/,
            {
                module: /@node/
            }
        ]
        
    };

};
