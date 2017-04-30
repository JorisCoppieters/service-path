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
let cprint = require('color-print');

let servicePath = require('./index');

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
let load_test = _ARGV['load-test'];
let rate = _ARGV['rate'] || 100;
let duration = _ARGV['duration'] || 1;

// ******************************
// Script:
// ******************************

main();

// ******************************
// Functions:
// ******************************

function main () {
  servicePath.setup({
    log_level: (verbose ? servicePath.k_LOG_LEVEL_VERBOSE : (info? servicePath.k_LOG_LEVEL_INFO : servicePath.k_LOG_LEVEL_SUCCESS)),
    log_single_line: !multi_line,
    service_registry: require('./service_registry/service_registry.json'),
    service_functions: require('./service_registry/service_functions'),
  });

  if (load_test) {
    testLoad(keywords, imageFile, categoryId, title, rate, duration);
  } else {
    printSuggestions(keywords, imageFile, categoryId, title);
  }
}

// ******************************

function testLoad (in_keywords, in_imageFile, in_categoryId, in_title, in_rate, in_duration) {
  output = output || 'listing_title';

  _runGenerator(function* () {

    let inputs = {
      keywords: in_keywords,
      image_file: in_imageFile,
      category_id: in_categoryId,
      title: in_title,
      suburb_id: 1,
      is_new: 1,
    };

    let path = yield servicePath.getServicePath(Object.keys(inputs), output);
    if (!path) {
      cprint.yellow('Couldn\'t find path');
      return;
    }

    let maxResponseTime = 1000;
    servicePath.loadTestServicePath(path, inputs, in_rate, in_duration, maxResponseTime);
  });
}

// ******************************

function printSuggestions (in_keywords, in_imageFile, in_categoryId, in_title) {
  output = output || 'listing_title';

  _runGenerator(function* () {

    let inputs = {
      keywords: in_keywords,
      image_file: in_imageFile,
      category_id: in_categoryId,
      title: in_title,
      suburb_id: 1,
      is_new: 1,
    };

    let suggestions = yield servicePath.getAndExecuteServicePath(inputs, output);
    if (!suggestions) {
      printStats();
      return;
    }

    if (Array.isArray(suggestions)) {
      console.log(cprint.toMagenta('-- ' + output + ' --'));
      suggestions.forEach((suggestion) => {
        if (!suggestion) {
          return;
        }

        if (suggestion.value && suggestion.confidence) {
          console.log(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestion.value) + ' ' + cprint.toYellow('(' + suggestion.confidence + ')'));
        } else if (suggestion.value) {
          console.log(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestion.value));
        } else {
          console.log(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestion));
        }
      });

    } else if (typeof(suggestions) === 'object') {
      let suggestionKey;
      let suggestionValues;
      let suggestionValue;
      let value;
      let first = true;

      Object.keys(suggestions).forEach((suggestionKey) => {
        suggestionValues = servicePath.getValue(suggestions[suggestionKey]);
        if (!suggestionValues) {
          return;
        }

        if (!first) {
          console.log();
        } else {
          first = false;
        }

        console.log(cprint.toMagenta('-- ' + suggestionKey + ' --'));
        console.log(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestionValues));
      });
    } else if (typeof(suggestions) === 'string') {
      console.log(cprint.toMagenta('-- ' + output + ' --'));
      console.log(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestions));
    } else {
      console.log(cprint.toMagenta('-- ' + output + ' --'));
      console.log(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestions));
    }

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

function _runGenerator (generatorFunction) {
  let next = function (err, arg) {
    if (err) return it.throw(err);

    let result = it.next(arg);
    if (result.done) return;

    if (result.value && result.value.then) {
      result.value
      .then((resolveResult) => {
        next(null, resolveResult);
      })
      .catch((rejectResult) => {
        next(rejectResult, null);
      });
    } else {
      next(null, result.value);
    }
  }

  let it = generatorFunction();
  return next();
}

// ******************************