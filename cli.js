#!/usr/bin/env node
"use strict";

var cliDefaults = require('./defaultConfig');
cliDefaults.height = cliDefaults.height.join(',');
cliDefaults.icons = cliDefaults.icons.join('');

var optimist = require('optimist'),
    argv     = optimist.
        usage("Usage: $0 folder").
        describe('version', "The Font Awesome version you want to reference (you can use git commit hashes or actual version number like v4.2.0").
        describe('color', "The default color for your icons").
        describe('height', "How high each icon needs to be").
        describe('icons', "Comma-separated list to limits icons to certain codes").
        describe('flexible', "Whether to run through optimiser or not").
        describe('png', "Include this to generate PNG files. Please note you will need to have an executable binary in your path for 'batik-rasterizer' or 'rsvg-convert'").
        default(cliDefaults).argv
    ;

if (argv.help || !argv._[0]) {
    optimist.showHelp();
    return;
}

argv.height = argv.height.split(',').map(function (el) {
    return el.trim();
});


if (!argv.icons) argv.icons = [];
else argv.icons = argv.icons.split(',').map(function (el) {
    return el.trim();
});

require('./index')(argv._[0], argv);