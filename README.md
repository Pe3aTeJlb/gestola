For God sake write it down

Setup:

install nvm
nvm install 22.17.1
nvm use 22.17.1

yarn setup
yarn debug:rbp

---------------
Command description

setup: install packages, repack better-sqlite3 for current node version. After change target node version repack sqlite. download plugins from theiaPlugins section of package json and build some packages + simlinks. Download verilator docker and build project (may produce errors, use debug:rbp)

repack-sqlite: repack better-sqlite3 for current using node version
update:dependencies: update eclipse theia version in all packages
update:plugins: update version of plugins in theiaPlugins. Modifying package.json
download:plugins: download plugins from both open-vsx amd vscode marketplace via script
build: clean old build data + build project
build:vscode-ext: build vscode extension for gramma and verible
clean:entire: clean all shit including node_modules, plugins, compiled .ts and node_modules simlinks
clean:all: clean not all shit: compiled .ts
rebuild: rebuild .ts files from all packages
debug: rebuild + play
debug:rb: read like debug:rebuild+bundle
debug:rbp: read like debug:rebuild+bundle+play
bundle: make electorn app build
play: lol, start app


# gestola-core
...The example of how to build the Theia-based applications with the gestola-core.

## Getting started

Please install all necessary [prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites).

## Running the browser example

    yarn build:browser
    yarn start:browser

*or:*

    yarn build:browser
    cd browser-app
    yarn start

*or:* launch `Start Browser Backend` configuration from VS code.

Open http://localhost:3000 in the browser.

## Running the Electron example

    yarn build:electron
    yarn start:electron

*or:*

    yarn build:electron
    cd electron-app
    yarn start

*or:* launch `Start Electron Backend` configuration from VS code.


## Developing with the browser example

Start watching all packages, including `browser-app`, of your application with

    yarn watch:browser

*or* watch only specific packages with

    cd gestola-core
    yarn watch

and the browser example.

    cd browser-app
    yarn watch

Run the example as [described above](#Running-the-browser-example)
## Developing with the Electron example

Start watching all packages, including `electron-app`, of your application with

    yarn watch:electron

*or* watch only specific packages with

    cd gestola-core
    yarn watch

and the Electron example.

    cd electron-app
    yarn watch

Run the example as [described above](#Running-the-Electron-example)

## Publishing gestola-core

Create a npm user and login to the npm registry, [more on npm publishing](https://docs.npmjs.com/getting-started/publishing-npm-packages).

    npm login

Publish packages with lerna to update versions properly across local packages, [more on publishing with lerna](https://github.com/lerna/lerna#publish).

    npx lerna publish
