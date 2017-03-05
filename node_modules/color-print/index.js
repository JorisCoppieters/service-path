'use strict';

// ******************************
//
//
// COLOR PRINT LIBRARY v1.0.2
//
// Version History:
//
// 1.0.2
// - Added more colours
// - Added background colours
// - Added bold, italic & underline
// - Clean up
//
// 1.0.1
// - Added tests
//
// 1.0.0
// - Stable release
//
// ******************************

// ******************************
// Constants:
// ******************************

const c_ANSI_RESET = 0;

const c_ANSI_BOLD = 1;
const c_ANSI_ITALIC = 3;
const c_ANSI_UNDERLINE = 4;

const c_ANSI_DEFAULT = 29;
const c_ANSI_BLACK = 30;
const c_ANSI_RED = 31;
const c_ANSI_GREEN = 32;
const c_ANSI_YELLOW = 33;
const c_ANSI_BLUE = 34;
const c_ANSI_MAGENTA = 35;
const c_ANSI_CYAN = 36;
const c_ANSI_LIGHT_GRAY = 37;
const c_ANSI_DARK_GRAY = 90;
const c_ANSI_LIGHT_RED = 91;
const c_ANSI_LIGHT_GREEN = 92;
const c_ANSI_LIGHT_YELLOW = 93;
const c_ANSI_LIGHT_BLUE = 94;
const c_ANSI_LIGHT_MAGENTA = 95;
const c_ANSI_LIGHT_CYAN = 96;
const c_ANSI_WHITE = 97;

const c_ANSI_BAC_DEFAULT = 49;
const c_ANSI_BAC_BLACK = 40;
const c_ANSI_BAC_RED = 41;
const c_ANSI_BAC_GREEN = 42;
const c_ANSI_BAC_YELLOW = 43;
const c_ANSI_BAC_BLUE = 44;
const c_ANSI_BAC_MAGENTA = 45;
const c_ANSI_BAC_CYAN = 46;
const c_ANSI_BAC_LIGHT_GRAY = 47;
const c_ANSI_BAC_DARK_GRAY = 100;
const c_ANSI_BAC_LIGHT_RED = 101;
const c_ANSI_BAC_LIGHT_GREEN = 102;
const c_ANSI_BAC_LIGHT_YELLOW = 103;
const c_ANSI_BAC_LIGHT_BLUE = 104;
const c_ANSI_BAC_LIGHT_MAGENTA = 105;
const c_ANSI_BAC_LIGHT_CYAN = 106;
const c_ANSI_BAC_WHITE = 107;

// ******************************
// Exports:
// ******************************

module.exports = {
    bold: printBold,
    italic: printItalic,
    underline: printUnderline,

    black: printBlack,
    blue: printBlue,
    cyan: printCyan,
    darkGray: printDarkGray,
    darkGrey: printDarkGray,
    green: printGreen,
    lightBlue: printLightBlue,
    lightCyan: printLightCyan,
    lightGray: printLightGray,
    lightGrey: printLightGray,
    lightGreen: printLightGreen,
    lightMagenta: printLightMagenta,
    lightRed: printLightRed,
    lightYellow: printLightYellow,
    magenta: printMagenta,
    red: printRed,
    white: printWhite,
    yellow: printYellow,
    rainbow: printRainbow,

    backgroundBlack: printBackgroundBlack,
    backgroundBlue: printBackgroundBlue,
    backgroundCyan: printBackgroundCyan,
    backgroundDarkGray: printBackgroundDarkGray,
    backgroundDarkGrey: printBackgroundDarkGray,
    backgroundGreen: printBackgroundGreen,
    backgroundLightBlue: printBackgroundLightBlue,
    backgroundLightCyan: printBackgroundLightCyan,
    backgroundLightGray: printBackgroundLightGray,
    backgroundLightGrey: printBackgroundLightGray,
    backgroundLightGreen: printBackgroundLightGreen,
    backgroundLightMagenta: printBackgroundLightMagenta,
    backgroundLightRed: printBackgroundLightRed,
    backgroundLightYellow: printBackgroundLightYellow,
    backgroundMagenta: printBackgroundMagenta,
    backgroundRed: printBackgroundRed,
    backgroundWhite: printBackgroundWhite,
    backgroundYellow: printBackgroundYellow,
    backgroundRainbow: printBackgroundRainbow,

    toBold: makeBold,
    toItalic: makeItalic,
    toUnderline: makeUnderline,

    toBlack: makeBlack,
    toBlue: makeBlue,
    toCyan: makeCyan,
    toDarkGray: makeDarkGray,
    toDarkGrey: makeDarkGray,
    toGreen: makeGreen,
    toLightBlue: makeLightBlue,
    toLightCyan: makeLightCyan,
    toLightGray: makeLightGray,
    toLightGrey: makeLightGray,
    toLightGreen: makeLightGreen,
    toLightMagenta: makeLightMagenta,
    toLightRed: makeLightRed,
    toLightYellow: makeLightYellow,
    toMagenta: makeMagenta,
    toRed: makeRed,
    toWhite: makeWhite,
    toYellow: makeYellow,
    toRainbow: makeRainbow,

    toBackgroundBlack: makeBackgroundBlack,
    toBackgroundBlue: makeBackgroundBlue,
    toBackgroundCyan: makeBackgroundCyan,
    toBackgroundDarkGray: makeBackgroundDarkGray,
    toBackgroundDarkGrey: makeBackgroundDarkGray,
    toBackgroundGreen: makeBackgroundGreen,
    toBackgroundLightBlue: makeBackgroundLightBlue,
    toBackgroundLightCyan: makeBackgroundLightCyan,
    toBackgroundLightGray: makeBackgroundLightGray,
    toBackgroundLightGrey: makeBackgroundLightGray,
    toBackgroundLightGreen: makeBackgroundLightGreen,
    toBackgroundLightMagenta: makeBackgroundLightMagenta,
    toBackgroundLightRed: makeBackgroundLightRed,
    toBackgroundLightYellow: makeBackgroundLightYellow,
    toBackgroundMagenta: makeBackgroundMagenta,
    toBackgroundRed: makeBackgroundRed,
    toBackgroundWhite: makeBackgroundWhite,
    toBackgroundYellow: makeBackgroundYellow,
    toBackgroundRainbow: makeBackgroundRainbow,
};

// ******************************
// Functions:
// ******************************

function printBold (input) { console.log(makeBold(input)); }
function printItalic (input) { console.log(makeItalic(input)); }
function printUnderline (input) { console.log(makeUnderline(input)); }

function printBlack (input) { console.log(makeBlack(input)); }
function printBlue (input) { console.log(makeBlue(input)); }
function printCyan (input) { console.log(makeCyan(input)); }
function printDarkGray (input) { console.log(makeDarkGray(input)); }
function printGreen (input) { console.log(makeGreen(input)); }
function printLightBlue (input) { console.log(makeLightBlue(input)); }
function printLightCyan (input) { console.log(makeLightCyan(input)); }
function printLightGray (input) { console.log(makeLightGray(input)); }
function printLightGreen (input) { console.log(makeLightGreen(input)); }
function printLightMagenta (input) { console.log(makeLightMagenta(input)); }
function printLightRed (input) { console.log(makeLightRed(input)); }
function printLightYellow (input) { console.log(makeLightYellow(input)); }
function printMagenta (input) { console.log(makeMagenta(input)); }
function printRed (input) { console.log(makeRed(input)); }
function printWhite (input) { console.log(makeWhite(input)); }
function printYellow (input) { console.log(makeYellow(input)); }
function printRainbow (input) { console.log(makeRainbow(input)); }

function printBackgroundBlack (input) { console.log(makeBackgroundBlack(input)); }
function printBackgroundBlue (input) { console.log(makeBackgroundBlue(input)); }
function printBackgroundCyan (input) { console.log(makeBackgroundCyan(input)); }
function printBackgroundDarkGray (input) { console.log(makeBackgroundDarkGray(input)); }
function printBackgroundGreen (input) { console.log(makeBackgroundGreen(input)); }
function printBackgroundLightBlue (input) { console.log(makeBackgroundLightBlue(input)); }
function printBackgroundLightCyan (input) { console.log(makeBackgroundLightCyan(input)); }
function printBackgroundLightGray (input) { console.log(makeBackgroundLightGray(input)); }
function printBackgroundLightGreen (input) { console.log(makeBackgroundLightGreen(input)); }
function printBackgroundLightMagenta (input) { console.log(makeBackgroundLightMagenta(input)); }
function printBackgroundLightRed (input) { console.log(makeBackgroundLightRed(input)); }
function printBackgroundLightYellow (input) { console.log(makeBackgroundLightYellow(input)); }
function printBackgroundMagenta (input) { console.log(makeBackgroundMagenta(input)); }
function printBackgroundRed (input) { console.log(makeBackgroundRed(input)); }
function printBackgroundWhite (input) { console.log(makeBackgroundWhite(input)); }
function printBackgroundYellow (input) { console.log(makeBackgroundYellow(input)); }
function printBackgroundRainbow (input) { console.log(makeBackgroundRainbow(input)); }

// ******************************

function makeBold (input, noReset) { return ansi(c_ANSI_BOLD, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeItalic (input, noReset) { return ansi(c_ANSI_ITALIC, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeUnderline (input, noReset) { return ansi(c_ANSI_UNDERLINE, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }

function makeBlack (input, noReset) { return ansi(c_ANSI_BLACK, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBlue (input, noReset) { return ansi(c_ANSI_BLUE, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeCyan (input, noReset) { return ansi(c_ANSI_CYAN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeDarkGray (input, noReset) { return ansi(c_ANSI_DARK_GRAY, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeGreen (input, noReset) { return ansi(c_ANSI_GREEN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeLightBlue (input, noReset) { return ansi(c_ANSI_LIGHT_BLUE, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeLightCyan (input, noReset) { return ansi(c_ANSI_LIGHT_CYAN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeLightGray (input, noReset) { return ansi(c_ANSI_LIGHT_GRAY, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeLightGreen (input, noReset) { return ansi(c_ANSI_LIGHT_GREEN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeLightMagenta (input, noReset) { return ansi(c_ANSI_LIGHT_MAGENTA, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeLightRed (input, noReset) { return ansi(c_ANSI_LIGHT_RED, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeLightYellow (input, noReset) { return ansi(c_ANSI_LIGHT_YELLOW, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeMagenta (input, noReset) { return ansi(c_ANSI_MAGENTA, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeRed (input, noReset) { return ansi(c_ANSI_RED, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeWhite (input, noReset) { return ansi(c_ANSI_WHITE, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeYellow (input, noReset) { return ansi(c_ANSI_YELLOW, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeRainbow (input, noReset) { return colorSequence(input, [makeRed, makeYellow, makeWhite, makeGreen, makeCyan, makeBlue, makeMagenta], noReset); }

function makeBackgroundBlack (input, noReset) { return ansi(c_ANSI_BAC_BLACK, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundBlue (input, noReset) { return ansi(c_ANSI_BAC_BLUE, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundCyan (input, noReset) { return ansi(c_ANSI_BAC_CYAN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundDarkGray (input, noReset) { return ansi(c_ANSI_BAC_DARK_GRAY, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundGreen (input, noReset) { return ansi(c_ANSI_BAC_GREEN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundLightBlue (input, noReset) { return ansi(c_ANSI_BAC_LIGHT_BLUE, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundLightCyan (input, noReset) { return ansi(c_ANSI_BAC_LIGHT_CYAN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundLightGray (input, noReset) { return ansi(c_ANSI_BAC_LIGHT_GRAY, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundLightGreen (input, noReset) { return ansi(c_ANSI_BAC_LIGHT_GREEN, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundLightMagenta (input, noReset) { return ansi(c_ANSI_BAC_LIGHT_MAGENTA, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundLightRed (input, noReset) { return ansi(c_ANSI_BAC_LIGHT_RED, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundLightYellow (input, noReset) { return ansi(c_ANSI_BAC_LIGHT_YELLOW, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundMagenta (input, noReset) { return ansi(c_ANSI_BAC_MAGENTA, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundRed (input, noReset) { return ansi(c_ANSI_BAC_RED, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundWhite (input, noReset) { return ansi(c_ANSI_BAC_WHITE, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundYellow (input, noReset) { return ansi(c_ANSI_BAC_YELLOW, !noReset) + input + (noReset ? '' : ansi(c_ANSI_RESET)); }
function makeBackgroundRainbow (input, noReset) { return colorSequence(input, [makeBackgroundRed, makeBackgroundYellow, makeBackgroundWhite, makeBackgroundGreen, makeBackgroundCyan, makeBackgroundBlue, makeBackgroundMagenta], noReset); }

// ******************************

function colorSequence (input, colorFns, noReset) {
    var inputLength = input.length;
    var segmentLength = Math.max(1, inputLength / colorFns.length);

    if (input.match(/\x1b\[/)) {
        return ansi(c_ANSI_DEFAULT, true) + input + ansi(c_ANSI_RESET);
    }

    var remaining = input;
    var colorFnIdx = 0;

    var line = '';

    while (remaining.length > 0) {
        var segment = remaining.substr(0, segmentLength);
        remaining = remaining.substr(segmentLength);

        var colorFn = colorFns[colorFnIdx];
        line += colorFn(segment, noReset);

        colorFnIdx = (colorFnIdx + 1) % colorFns.length;
    }

    return line;
}

// ******************************

function ansi (ansiColorCode, reset) {
    if (reset) {
        return '\x1b[0;' + ansiColorCode + 'm';
    }
    return '\x1b[' + ansiColorCode + 'm';
}

// ******************************