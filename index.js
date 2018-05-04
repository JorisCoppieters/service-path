'use strict'; // JS: ES6

// ******************************
//
//
// SERVICE PATH v0.1.33
//
// 0.1.9
// - Allow unsecured HTTPS requests
//
// 0.1.0
// - Initial release
//
// ******************************

// ******************************
// Requires:
// ******************************

const execution = require('./src/execution');
const log = require('./src/log');
const printInfo = require('./src/printInfo');
const registry = require('./src/registry');
const utils = require('./src/utils');
const paths = require('./src/paths');

// ******************************
// Functions:
// ******************************

function setup (config) {
    config = config || {};

    log.setLogger(utils.getProperty(config, 'logger', false));
    log.setLogLevel(utils.getProperty(config, 'log_level', log.k_LOG_LEVEL_WARNING));
    log.setLogSingleLine(utils.getProperty(config, 'log_single_line', false));

    registry.clearRegistry();
    registry.clearFunctions();

    registry.setRegistry(utils.getProperty(config, 'service_registry', {}));
    registry.setFunctions(utils.getProperty(config, 'service_functions', {}));
}

// ******************************
// Exports:
// ******************************

module.exports['k_LOG_LEVEL_NONE'] = log.k_LOG_LEVEL_NONE;
module.exports['k_LOG_LEVEL_ERROR'] = log.k_LOG_LEVEL_ERROR;
module.exports['k_LOG_LEVEL_WARNING'] = log.k_LOG_LEVEL_WARNING;
module.exports['k_LOG_LEVEL_SUCCESS'] = log.k_LOG_LEVEL_SUCCESS;
module.exports['k_LOG_LEVEL_INFO'] = log.k_LOG_LEVEL_INFO;
module.exports['k_LOG_LEVEL_VERBOSE'] = log.k_LOG_LEVEL_VERBOSE;

module.exports['clearAllDisabledServices'] = registry.clearAllDisabledServices;
module.exports['clearServicePathsUsed'] = paths.clearServicePathsUsed;
module.exports['clearServiceStats'] = registry.clearServiceStats;
module.exports['executeServicePath'] = execution.executeServicePath;
module.exports['getAndExecuteServicePath'] = execution.getAndExecuteServicePath;
module.exports['getProperty'] = utils.getProperty;
module.exports['getServicePath'] = paths.getServicePath;
module.exports['getServicePathsUsed'] = paths.getServicePathsUsed;
module.exports['getServicePathsUsedHTML'] = printInfo.getServicePathsUsedHTML;
module.exports['getServiceStats'] = registry.getServiceStats;
module.exports['getServiceStatsHTML'] = printInfo.getServiceStatsHTML;
module.exports['getTypes'] = registry.getTypes;
module.exports['getValue'] = utils.getValue;
module.exports['loadTestServicePath'] = execution.loadTestServicePath;
module.exports['log'] = log;
module.exports['printLoadTestServicePath'] = execution.printLoadTestServicePath;
module.exports['printServicePathsUsed'] = printInfo.servicePathsUsed;
module.exports['printServiceStats'] = printInfo.serviceStats;
module.exports['setRandomData'] = execution.setRandomData;
module.exports['setup'] = setup;

// ******************************