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

    servicePath.setRandomData('KEYWORDS',
        [
            'book','bottle','mitten','plant','scissors'
        ]
    );

    servicePath.setRandomData('KEYWORDS->CATEGORY_ID',
        {
            book:4537,bottle:2890,mitten:6465,plant:4212,scissors:3033
        }
    );

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

        let maxResponseTime = 1000;
        yield servicePath.loadTestServicePath(inputs, output, in_rate, in_duration, maxResponseTime);
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
            printLine(cprint.toMagenta('-- ' + output + ' --'));
            suggestions.forEach((suggestion) => {
                if (!suggestion) {
                    return;
                }

                if (suggestion.value && suggestion.confidence) {
                    printLine(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestion.value) + ' ' + cprint.toYellow('(' + suggestion.confidence + ')'));
                } else if (suggestion.value) {
                    printLine(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestion.value));
                } else {
                    printLine(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestion));
                }
            });

        } else if (typeof(suggestions) === 'object') {
            let suggestionValues;
            let first = true;

            Object.keys(suggestions).forEach((suggestionKey) => {
                suggestionValues = servicePath.getValue(suggestions[suggestionKey]);
                if (!suggestionValues) {
                    return;
                }

                if (!first) {
                    printLine();
                } else {
                    first = false;
                }

                printLine(cprint.toMagenta('-- ' + suggestionKey + ' --'));
                printLine(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestionValues));
            });
        } else if (typeof(suggestions) === 'string') {
            printLine(cprint.toMagenta('-- ' + output + ' --'));
            printLine(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestions));
        } else {
            printLine(cprint.toMagenta('-- ' + output + ' --'));
            printLine(cprint.toWhite('-') + ' ' + cprint.toCyan(suggestions));
        }

        printStats();
    });
}

// ******************************

function printLine (in_line) {
    process.stdout.write((in_line ? in_line : '') + '\n');
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
    };

    let it = generatorFunction();
    return next();
}

// ******************************