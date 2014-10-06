"use strict";

var request = require('superagent'),
    path    = require('path'),
    fs      = require('graceful-fs'),
    mkdir   = require('mkdirp'),
    config  = require('./defaultConfig')
    ;

function splitupSvgContent(fontSvgDefinition, fontNameRefs) {
    var iconNamingConventions = require('js-yaml').safeLoad(fontNameRefs).icons,
        fontAwesomeGlyphs = fontSvgDefinition.match(/<glyph.*?d=.{10,}?>/g), //filter for glyphs with real path specified
        defaultCharWidth = fontSvgDefinition.match(/<font id="fontawesomeregular" horiz-adv-x="(\d+)"/)[1],
        defaultCharHeight = fontSvgDefinition.match(/<font-face units-per-em="(\d+)"/)[1],
        iconNameByCode = {},
        iconSvgCodes = {};


    console.info("Found " + fontAwesomeGlyphs.length + " available icons in the font");
    console.info("Generating SVG data for each icon...");

    iconNamingConventions.forEach(function (icon) {
        iconNameByCode[icon.unicode] = icon.id;
    });

    fontAwesomeGlyphs.forEach(function (glyph) {
        var iconCode = glyph.match(/unicode="&#x([a-f0-9]+);"/)[1],
            pathData = glyph.match(/d="(.+?)"/)[1],
            customWidthMatch = glyph.match(/horiz-adv-x="(.*?)"/),
            contentWidth = customWidthMatch ? customWidthMatch[1] : defaultCharWidth,
            iconName = iconNameByCode[iconCode];

        if (!iconName) console.log(glyph);

        if (config.icons.length && config.icons.indexOf(iconName) == -1) {
            return;
        }
        config.height.forEach(function (svgHeight) {
            var scalingRatio = (svgHeight / defaultCharHeight),
                svgWidth = (contentWidth * scalingRatio),
                svgContent = '<svg xmlns="http://www.w3.org/2000/svg" ' +
                    'width="' + svgWidth + '" height="' + svgHeight + '" ' +
                    'viewBox="0 0 ' + contentWidth + ' ' + defaultCharHeight + '">' +
                    '<g transform="scale(1,-1) translate(0 -1506)">' +
                    '<path d="' + pathData + '" fill="' + config.color + '" />' +
                    '</g><!--width-to-height ratio is ' + (svgWidth / svgHeight) + '--></svg>';

            if (typeof iconSvgCodes[iconName] == 'undefined') {
                iconSvgCodes[iconName] = {}
            }
            iconSvgCodes[iconName][svgHeight] = svgContent;
        });
    });

    return iconSvgCodes;
}

function generateSvgFiles(folder, content) {
    var numSvgFiles = 0;
    Object.keys(content).forEach(function (iconName) {
        var iconSvgs = content[iconName];
        Object.keys(iconSvgs).forEach(function (svgHeight) {
            var svgDir = path.join(folder, 'svg', svgHeight);
            ensureDir(svgDir);
            fs.writeFileSync(path.join(svgDir, iconName + '.svg'), iconSvgs[svgHeight]);
            numSvgFiles++;
        })
    });

    console.log("Saved " + numSvgFiles + " SVG files");

    generatePngsFromFolder(folder);
    //svgo = new (require('svgo')),
    //svgo.optimize(svgContent, function (result) {
    //    fs.writeFileSync(saveFilePath, result.data);
    //});
}

function generatePngsFromFolder(folder) {
    var spawn = require('child_process').spawn;

    ensureDir(path.join(config.color, 'png'));

    config.height.forEach(function (size) {
        size = size.trim();
        var targetDir = path.join(config.color, 'png', size.toString());
        ensureDir(targetDir);
        var ps = spawn('java', ['-jar', __dirname + '/batik-rasterizer.jar', "$@", '-d', targetDir, '-h', size, path.join(config.color, 'svg')]);
        ps.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        ps.stderr.on('data', function (data) {
            console.log(data.toString());
        });
    });
}

function ensureDir(fullPath) {
    if (!fs.existsSync(fullPath)) mkdir.sync(fullPath);
}


module.exports = function (destinationFolder, userConfig) {
    //merge-in configuration from the user
    if (typeof userConfig == 'object') {
        Object.keys(userConfig).forEach(function (userKey) {
            config[userKey] = userConfig[userKey];
        });
    }

    console.info("Loading FontAwesome details for '" + config.version + "' from GitHub...");

    var loadFontAwesomeData = ['/fonts/fontawesome-webfont.svg', '/src/icons.yml'];
    loadFontAwesomeData.forEach(function (sourceUrl, sourceIdx) {
        request.
            get("https://raw.githubusercontent.com/FortAwesome/Font-Awesome/" + config.version + sourceUrl).
            on('error', function (err) {
                console.error(err);
            }).
            end(function (res) {
                if (res.error) {
                    console.error(res.error);
                    return;
                }
                loadFontAwesomeData[sourceIdx] = res.text;
                if (loadFontAwesomeData[0].length > 1000 && loadFontAwesomeData[1].length > 1000) {
                    var svgContent = splitupSvgContent(loadFontAwesomeData[0], loadFontAwesomeData[1]);
                    generateSvgFiles(destinationFolder, svgContent);
                }
            });
    });
}