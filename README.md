# Gestola Overview

Gestola is an ECAD based on Eclipse Theia

## Getting Started

Here listed all steps to setup project correctly

### Prerequisites

    node 22.17.1 
    electron 37.2.1

install nvm and then install node 22.17.1 and use it

    nvm install 22.17.1  
    nvm use 22.17.1

Python3 is required for the build due to node-gyp

### Setup

Run

    yarn setup
to setup project.  
This command will install npm packages, repack better-sqlite3 for current node version, download and build plugins from theiaPlugins section of package.json, download verilator docker and build project.
(may produce errors, use debug:rbp)

    yarn debug:rb

This is an ultimative command to rebuild all project packages and build electron app.  

### Running electron

After build run

    yarn play
to start Gestola.

## Common commands description

    setup - install packages, repack better-sqlite3 for current node version. After change target node version repack sqlite. download plugins from theiaPlugins section of package json and build some packages + simlinks. Download verilator docker and build project (may produce errors, use debug:rbp)

    repack-sqlite - repack better-sqlite3 for current using node version

    update:dependencies - update eclipse theia version in all packages
    update:plugins - update version of plugins in theiaPlugins. Modifying package.json
    download:plugins - download plugins from both open-vsx amd vscode marketplace via script

    build - clean old build data + build project
    build:vscode-ext - build vscode extension for grammar and verible

    clean:entire - clean all shit including node_modules, plugins, compiled .ts, node_modules and simlinks
    clean:all - clean compiled .ts

    rebuild - rebuild all Gestola packages
    rebuild:under-dev - rebuild specific packages under development (listed manually)
    rebuild:prod - rebuild all Gestola packages for productive build
    rebuild:"package-name" - rebuild specific package

    debug - rebuild + bundle + play
    debug:rb - read like debug: rebuild + bundle
    debug:rdbp - read like debug: rebuild:under-dev + bundle + play

    bundle - make electorn app build

    play - start app

## Development

After adding new package to project:  

1. Add reference in ./tsconfig.json
2. Add package to dependencies in ./electron-app
3. Update packages structure with yarn
4. Rebuild project

## Troubleshooting

### Better-sqlite problems

1. Delete package in project node_modules  
2. Reinstall it with yarn
3. Run repack-sqlite

## Usefull links for development

Many of package scoped links listed in appropriated packages

### General

1. <https://github.com/eclipse-theia/theia> Eclipse Theia main github
2. <https://github.com/eclipse-theia/theia-ide> Eclipse Theia app builder

### Theming

1. <https://code.visualstudio.com/api/references/icons-in-labels> VSCode icons reference
2. <https://code.visualstudio.com/api/references/theme-color> VScode colortheme reference
3. <https://fontawesome.ru/all-icons/> Font Awansome icons
