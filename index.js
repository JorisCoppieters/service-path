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

let clone = require('clone');
let cprint = require('color-print');
let Promise = require('bluebird');

let execution = require('./src/execution');
let log = require('./src/log');
let paths = require('./src/paths');
let print = require('./src/print');
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

function printServiceStats () {
  print.out('\n' + cprint.toYellow('-- ' + 'Service Stats' + ' --') + '\n');

  let service;
  let serviceKey;
  let serviceName;
  let serviceType;
  let serviceError;
  let serviceWarning;
  let serviceResponseTime;
  let serviceRequestOptions;

  let compareA;
  let compareB;

  let serviceStats = registry.getServiceStats();

  serviceStats = serviceStats.sort((a, b) => {
    serviceKey = utils.getProperty(a, 'service_key', false);
    service = registry.getService(serviceKey);
    if (!service) {
      return -1;
    }

    compareA = utils.getProperty(service, 'name', false);

    serviceKey = utils.getProperty(b, 'service_key', false);
    service = registry.getService(serviceKey);
    if (!service) {
      return -1;
    }

    compareB = utils.getProperty(service, 'name', false);

    if (compareA < compareB) { return -1; }
    if (compareA > compareB) { return 1; }
    return 0;
  });

  serviceStats.forEach((serviceStats) => {
    serviceKey = utils.getProperty(serviceStats, 'service_key', false);
    service = registry.getService(serviceKey);
    if (!service) {
      return;
    }

    serviceName = utils.getProperty(service, 'name', false);
    serviceType = utils.getProperty(service, 'type', false);
    serviceError = utils.getProperty(serviceStats, 'error');
    serviceWarning = utils.getProperty(serviceStats, 'warning');
    serviceResponseTime = parseFloat(utils.getProperty(serviceStats, 'response_time', 0));

    if (serviceError) {
      print.out(cprint.toRed('- ' + serviceName + ' (' + serviceKey + '):' + serviceError) + '\n');
      serviceRequestOptions = utils.getProperty(serviceStats, 'request_options');
      if (serviceRequestOptions) {
        print.out(cprint.toRed('  * URI: ' + serviceRequestOptions.uri + '\n'));
        print.out(cprint.toRed('  * Timeout: ' + serviceRequestOptions.timeout + '\n'));
      }
    } else if (serviceWarning) {
      print.out(cprint.toYellow('- ' + serviceName + ' (' + serviceKey + '): ' + serviceWarning) + '\n');
    } else {
      print.out(cprint.toWhite('- ' + serviceName + ' (' + serviceKey + ') took ' + serviceResponseTime + 'ms') + '\n');
    }
  });
}

// ******************************

function printServicePathsUsed () {
  print.out(cprint.toYellow('\n' + '-- ' + 'Service Paths Used' + ' --') + '\n');

  let servicePaths = paths.getServicePathsUsed();

  let servicePathNodeNames;
  Object.keys(servicePaths).forEach((servicePathKey) => {
    servicePathNodeNames = servicePaths[servicePathKey];
    print.out(cprint.toWhite('- ' + servicePathKey + ' [\n    ' + servicePathNodeNames.join('\n    ') + '\n]') + '\n');
  });
}

// ******************************

function getAndExecuteServicePath (in_inputs, in_outputType) {
  return new Promise((resolve, reject) => {
    utils.runGenerator(function* () {
      try {
        let inputs = clone(in_inputs);
        let servicePath = yield paths.getServicePath(Object.keys(inputs), in_outputType);
        let result = yield execution.executeServicePath(servicePath, inputs);

        let tryCount = 0;
        while (tryCount++ < 3 && !result[in_outputType]) {
          log.warning('Trying again...');
          inputs = clone(in_inputs);
          servicePath = yield paths.getServicePath(Object.keys(inputs), in_outputType);
          result = yield execution.executeServicePath(servicePath, inputs);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ******************************
// Exports:
// ******************************

module.exports['setup'] = setup;
module.exports['printServiceStats'] = printServiceStats;
module.exports['printServicePathsUsed'] = printServicePathsUsed;
module.exports['getAndExecuteServicePath'] = getAndExecuteServicePath;

// ******************************