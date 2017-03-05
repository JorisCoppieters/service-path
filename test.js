'use strict'; // JS: ES6

// ******************************
//
//
// TEST
//
//
// ******************************

// ******************************
// Requires:
// ******************************

let minimist = require('minimist');
let Promise = require('bluebird');
let cprint = require('color-print');

let servicePath = require('./index');

let execution = require('./src/execution');
let log = require('./src/log');
let print = require('./src/print');
let printInfo = require('./src/printInfo');
let utils = require('./src/utils');

// ******************************
// Script Args:
// ******************************

let _ARGV = minimist(process.argv.slice(2));
let keywords = _ARGV['keywords'];
let imageFile = _ARGV['image'] || _ARGV['image-file'];
let title = _ARGV['title'];
let categoryId = _ARGV['category'] || _ARGV['category-id'];

let verbose = _ARGV['verbose'];
let info = _ARGV['info'];
let stats = _ARGV['stats'];
let paths = _ARGV['paths'];
let multi_line = _ARGV['multi-line'];
let output = _ARGV['output'];

// ******************************
// Script:
// ******************************

main();

// ******************************
// Functions:
// ******************************

function main () {
  servicePath.setup({
    log_level: (verbose ? log.k_LOG_LEVEL_VERBOSE : (info? log.k_LOG_LEVEL_INFO : false)),
    log_single_line: !multi_line,
    service_registry: require('./service_registry.json'),
    service_functions: require('./service_functions'),
  });

  printSuggestions(keywords, imageFile, categoryId, title);
}

// ******************************

function printSuggestions (in_keywords, in_imageFile, in_categoryId, in_title) {
  output = output || 'listing_title';

  utils.runGenerator(function* () {

    let inputs = {
      keywords: in_keywords,
      image_file: in_imageFile,
      category_id: in_categoryId,
      title: in_title,
      suburb_id: 1,
      is_new: 1,
    };

    let sellSuggestions = yield execution.getAndExecuteServicePath(inputs, output);
    let suggestions = utils.getProperty(sellSuggestions, output);
    if (!suggestions) {
      printStats();
      return;
    }

    print.clearLine();

    if (typeof(suggestions) === 'object') {
      let suggestionKey;
      let suggestionValues;
      let suggestionValue;
      let value;
      let first = true;

      Object.keys(suggestions).forEach((suggestionKey) => {
        suggestionValues = utils.getValue(suggestions[suggestionKey]);
        if (!suggestionValues) {
          return;
        }

        if (!first) {
          print.out('\n');
        } else {
          first = false;
        }

        print.out(cprint.toMagenta('-- ' + suggestionKey + ' --') + '\n');

        if (Array.isArray(suggestionValues)) {
          suggestionValues.forEach((suggestionValue) => {

            value = suggestionValue.value;
            if (typeof(value) === 'string') {
              value = value.trim();
            } else if (Array.isArray(value) && value.length === 3) {
              value = UTIL_FUNCTIONS.colour_to_string(value);
            }

            print.out(cprint.toWhite('-') + ' ' + cprint.toCyan(value) + ' ' + cprint.toYellow('(' + (suggestionValue.confidence || 1) + ')') + '\n');
          });
        } else {
            print.out(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestionValues) + '\n');
        }
      });
    } else if (typeof(suggestions) === 'string') {
      print.out(cprint.toMagenta('-- ' + output + ' --') + '\n');
      print.out(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestions) + '\n');
    }

    printStats();
  });
}

// ******************************

function printStats () {
  if (stats) {
    printInfo.serviceStats();
  }

  if (paths) {
    printInfo.servicePathsUsed();
  }
}

// ******************************