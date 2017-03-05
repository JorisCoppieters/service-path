'use strict'; // JS: ES5

// ******************************
//
//
// PRINT
//
//
// ******************************

// ******************************
// Functions:
// ******************************

function clearLine () {
  out('\r' + ' '.repeat(100) + '\r');
}

// ******************************

function out (in_string) {
  process.stdout.write(in_string);
}

// ******************************
// Exports:
// ******************************

module.exports['clearLine'] = clearLine;
module.exports['out'] = out;

// ******************************