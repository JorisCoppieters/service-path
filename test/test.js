'use strict';

// ******************************
// Requires:
// ******************************

let servicePath = require('../index');
let minimist = require('minimist');

// ******************************
// Globals:
// ******************************

let g_ARGV = minimist(process.argv.slice(2));
let stats = g_ARGV['stats'];

// ******************************
// Setup:
// ******************************

servicePath.setup({
    log_level: servicePath.k_LOG_LEVEL_INFO,
    service_registry: require('./registry/service_registry.json'),
    service_functions: require('./registry/service_functions.js'),
});

let outputType = g_ARGV['output'] || 'ascii';

let inputs = [];
Object.keys(g_ARGV).forEach(key => {
    if (typeof(g_ARGV[key]) === 'undefined' || g_ARGV[key] === null) {
        return;
    }
    if (key === 'output' || key === '_') {
        return;
    }

    inputs[key] = g_ARGV[key];
});

servicePath.clearServiceStats();
servicePath.clearServicePathsUsed();
servicePath.clearDisabledServices();
servicePath.getAndExecuteServicePath(inputs, outputType, 1).then(output => {
    printLine(output);
    if (stats) {
        printStats();
    }
});

// ******************************
// Functions:
// ******************************

function printStats () {
    servicePath.printServiceStats();
    servicePath.printServicePathsUsed();
}

// ******************************

function printLine (in_string) {
    let string = in_string;
    if (string === null) {
        string = '[NULL]';
    } else if (typeof(string) === 'object') {
        string = JSON.stringify(string, null, 4);
    } else if (typeof(string) !== 'string') {
        string = string.toString();
    }
    process.stdout.write(string + '\n');
}

// ******************************