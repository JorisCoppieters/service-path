'use strict'; // JS: ES6

// ******************************
//
//
// SERVICE PATH v0.1.0
//
// 0.1.0
// - Initial release
//
// ******************************

// ******************************
// Requires:
// ******************************

let minimist = require('minimist');
let Promise = require('bluebird');
let cprint = require('color-print');

let log = require('./src/log');
let print = require('./src/print');
let servicePath = require('./index');
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
  utils.runGenerator(function* () {
    let sellSuggestions = yield getSuggestions(in_keywords, in_imageFile, in_categoryId, in_title);
    let suggestions = utils.getProperty(sellSuggestions, 'sell_suggestions');
    if (!suggestions) {
      printStats();
      return;
    }

    print.clearLine();

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

    printStats();
  });
}

// ******************************

function printStats () {
  if (stats) {
    servicePath.printServiceStats();
  }

  if (paths) {
    servicePath.printServicePathsUsed();
  }
}

// ******************************

function getSuggestions (in_keywords, in_imageFile, in_categoryId, in_title) {
  return new Promise((resolve) => {
    utils.runGenerator(function* () {
      let inputs = {};

      if (in_keywords) {
        inputs['keywords'] = in_keywords;
      }

      if (in_imageFile) {
        inputs['image_file'] = in_imageFile;
      }

      if (in_categoryId) {
        inputs['category_id'] = in_categoryId;
      }

      if (in_title) {
        inputs['title'] = in_title;
      }

      inputs['suburb_id'] = 1;
      inputs['is_new'] = 1;

      let suggestions = yield servicePath.getAndExecuteServicePath(inputs, 'sell_suggestions');
      return resolve(suggestions);
    });
  });
}

// ******************************