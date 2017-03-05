'use strict';

var cprint = require('./index.js');

// ******************************

cprint.white('I am White');
cprint.red('I am Red');
cprint.yellow('I am Yellow');
cprint.green('I am Green');
cprint.cyan('I am Cyan');
cprint.blue('I am Blue');
cprint.magenta('I am Magenta');
cprint.rainbow('I am Rainbow');

cprint.backgroundWhite('My background is White');
cprint.backgroundRed('My background is Red');
cprint.backgroundYellow('My background is Yellow');
cprint.backgroundGreen('My background is Green');
cprint.backgroundCyan('My background is Cyan');
cprint.backgroundBlue('My background is Blue');
cprint.backgroundMagenta('My background is Magenta');
cprint.backgroundRainbow('My background is Rainbow');

console.log('Making ' + cprint.toRed('everything red', true) + ' from now on... ' + cprint.toRed('until here') + ' hopefully');

console.log('Pa' + cprint.toRed('rtia') + 'l');
console.log('A ' + cprint.toRainbow('much longer partia') + 'l');

cprint.backgroundDarkGrey(cprint.toRainbow('My background is Dark Gray and my foreground is Rainbow', true), true);
cprint.darkGrey(cprint.toBackgroundRainbow('My background is Rainbow and my foreground is Dark Gray', true), true);
console.log('I should be uncoloured');
cprint.backgroundRainbow(cprint.toWhite('Cannot print colored segment as rainbow, I should be white', true), true);
console.log('I should be uncoloured');
cprint.backgroundRed(cprint.toBlue('My background is Red and my foreground is Blue', true), true);
console.log('I should be uncoloured');
cprint.backgroundYellow(cprint.toMagenta('My background is Yellow and my foreground is Magenta', true), true);
console.log('I should be uncoloured');
cprint.backgroundGreen(cprint.toBlue('My background is Green and my foreground is Blue', true), true);
console.log('I should be uncoloured');
cprint.backgroundCyan(cprint.toBlack('My background is Cyan and my foreground is Black', true), true);
console.log('I should be uncoloured');
cprint.backgroundBlue(cprint.toWhite('My background is Blue and my foreground is White', true), true);
console.log('I should be uncoloured');
cprint.backgroundMagenta(cprint.toYellow('My background is Magenta and my foreground is Yellow', true), true);
console.log('I should be uncoloured');

cprint.bold('I should be bold');
cprint.italic('I should be italic');
cprint.underline('I should be underline');

cprint.bold(cprint.toUnderline(cprint.toItalic(cprint.toBackgroundDarkGrey(cprint.toRainbow('Combo Wombo', true), true), true), true), true);


// ******************************
