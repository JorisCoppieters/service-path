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
let servicePath = require('../index.js');

// ******************************
// Script Args:
// ******************************

let _ARGV = minimist(process.argv.slice(2));

let verbose = _ARGV['verbose'];
let info = _ARGV['info'];
let multi_line = _ARGV['multi-line'];
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
        service_registry: require('./registry/service_registry.json'),
        service_functions: require('./registry/service_functions'),
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

    testLoad(rate, duration);
}

// ******************************

function testLoad (in_rate, in_duration) {
    let output = 'ascii';

    let inputs = {
        imageUrl: 'https://www.noelleeming.co.nz/shop/renderImage.image\?imageName\=products%2F153%2F153233.jpg'
    };

    let maxResponseTime = 1000;
    servicePath.printLoadTestServicePath(inputs, output, in_rate, in_duration, maxResponseTime);
}

// ******************************