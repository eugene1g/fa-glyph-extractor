"use strict";

var control = require('./index'),
    fs      = require('fs'),
    util    = require('./util');


util.loadUrls('https://raw.githubusercontent.com/zurb/foundation-icon-fonts/master/_foundation-icons.scss', function (remoteText) {
    var definitionLines = remoteText.match(/.fi-.*?content.*?".*?"/g),
        convertFilenames = {};

    definitionLines.forEach(function (line) {
        var charName = line.match(/fi-(.*?):/)[1],
            charCode = line.match(/content.*?"(.*?)"/)[1];
        convertFilenames[charCode.replace('\\', '')] = charName;
    });
    control('test/fi', fs.readFileSync('testsources/foundation.svg', 'utf-8'), {filenames: convertFilenames, genPng: [200]});
});

util.loadUrls('https://raw.githubusercontent.com/twbs/bootstrap/master/less/glyphicons.less', function (remoteText) {
    var definitionLines = remoteText.match(/\.glyphicon\-.*?content.*?"(.*?)"/g),
        convertFilenames = {};
    definitionLines.forEach(function (line) {
        var charName = line.match(/glyphicon-(.*?)\s/)[1],
            charCode = line.match(/content.*?"(.*?)"/)[1];
        convertFilenames[charCode.replace('\\', '')] = charName;
    });
    control('test/glyphicon', fs.readFileSync('testsources/gly.svg', 'utf-8'), {filenames: convertFilenames, genPng: [200]});
});


var version = "v4.2.0";
util.loadUrls([
    'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/' + version + '/src/icons.yml',
    //'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/' + version + '/fonts/fontawesome-webfont.svg',
], function (remoteContent) {
    var iconNamingConventions = require('js-yaml').safeLoad(remoteContent[0]).icons;
    var convertFilenames = {};
    iconNamingConventions.forEach(function (icon) {
        convertFilenames[icon.unicode] = icon.id;
    });

    //1519 for normal, 1536 for offsetted
    control('test/fa', fs.readFileSync('testsources/fa.svg', 'utf-8'), {filenames: convertFilenames, genPng: [200]});
});