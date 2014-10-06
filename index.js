"use strict";

var request = require('superagent'),
    path    = require('path'),
    fs      = require('graceful-fs'),
    svgo    = new (require('svgo')),
    mkdir   = require('mkdirp'),
    config  = require('./defaultConfig')
    ;

function splitupSvgContent(fontSvgDefinition, fontNameRefs, callback) {
    var iconNamingConventions = require('js-yaml').safeLoad(fontNameRefs).icons,
        fontAwesomeGlyphs = fontSvgDefinition.match(/<glyph.*?d=.{10,}?>/g), //filter for glyphs with real path specified
        defaultCharWidth = fontSvgDefinition.match(/<font id="fontawesomeregular" horiz-adv-x="(\d+)"/)[1],
        defaultCharHeight = fontSvgDefinition.match(/<font-face units-per-em="(\d+)"/)[1],
        iconNameByCode = {},
        iconSvg = []
        ;


    iconNamingConventions.forEach(function (icon) {
        iconNameByCode[icon.unicode] = icon.id;
    });

    console.info("Found " + fontAwesomeGlyphs.length + " available icons in the font");
    console.info("Generating SVG data for each icon...");

    fontAwesomeGlyphs.forEach(function (glyph) {
        var iconCode = glyph.match(/unicode="&#x([a-f0-9]+);"/)[1],
            iconName = iconNameByCode[iconCode],
            pathData = glyph.match(/d="(.+?)"/)[1],
            customWidthMatch = glyph.match(/horiz-adv-x="(.*?)"/),
            contentWidth = customWidthMatch ? customWidthMatch[1] : defaultCharWidth
            ;

        if (config.icons.length && config.icons.indexOf(iconName) == -1) {
            return;
        }

        iconSvg.push({
            iconName: iconName,
            svg: '<svg xmlns="http://www.w3.org/2000/svg" ' +
                 'viewBox="0 0 ' + contentWidth + ' ' + defaultCharHeight + '">' +
                 '<g transform="scale(1,-1) translate(0 -1519)">' +
                 '<path d="' + pathData + '" fill="' + config.color + '" />' +
            '</g></svg>'
        });
    });

    var optimizedCount = 0;
    iconSvg.forEach(function (ic, idx) {
        svgo.optimize(ic.svg, function (result) {
            iconSvg[idx].svg = result.data;
            if (++optimizedCount == iconSvg.length) {
                callback(iconSvg);
            }
        });
    });
}

function saveSvgFiles(folder, iconSvgs) {
    var numSvgFiles = 0,
        svgDir = path.join(folder, 'svg');

    ensureDir(svgDir);

    iconSvgs.forEach(function (icInfo) {
        numSvgFiles++;
        fs.writeFileSync(path.join(svgDir, icInfo.iconName + '.svg'), icInfo.svg);
    });

    console.log("Saved " + numSvgFiles + " SVG files");

    //generatePngsFromFolder(folder);

}

function generatePngsFromFolder(folder) {
    var spawn = require('child_process').spawn;

    config.height.forEach(function (size) {
        size = String(size).trim();
        var targetDir = path.join(folder, 'png', size.toString());
        ensureDir(targetDir);
        //var ps = spawn('java', ['-jar', __dirname + '/batik-rasterizer.jar', "$@", '-d', targetDir, '-h', size, path.join(config.color, 'svg')]);
        //var ps = spawn('batik-rasterizer', ['-d', targetDir, '-h', size, path.join(folder, 'svg')]);
        var ps = spawn('batik-rasterizer', ['-d', targetDir, '-h', size, path.join(folder, 'svg')]);
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
                    splitupSvgContent(loadFontAwesomeData[0], loadFontAwesomeData[1], function (svgContent) {
                        saveSvgFiles(destinationFolder, svgContent);
                    });
                }
            });
    });
}