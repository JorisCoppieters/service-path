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

let log = require('./src/log');
let registry = require('./src/registry');
let utils = require('./src/utils');

// ******************************
// Globals:
// ******************************

// ******************************
// Functions:
// ******************************

function setup (config) {
  config = config || {};

  log.setLogLevel(utils.getProperty(config, 'log_level', log.k_LOG_LEVEL_WARNING));
  log.setLogSingleLine(utils.getProperty(config, 'log_single_line', true));
  registry.setRegistry(utils.getProperty(config, 'service_registry', {}));
  registry.setFunctions(utils.getProperty(config, 'service_functions', {}));
}

// ******************************
// Exports:
// ******************************

module.exports['setup'] = setup;

// ******************************