'use strict'; // JS: ES6

// ******************************
//
//
// PRINT INFO
//
//
// ******************************

// ******************************
// Requires:
// ******************************

let cprint = require('color-print');

let paths = require('./paths');
let print = require('./print');
let registry = require('./registry');
let utils = require('./utils');

// ******************************
// Functions:
// ******************************

function printServiceStats () {
  print.out('\n' + cprint.toMagenta('-- ' + 'Service Stats' + ' --') + '\n');

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
  print.out(cprint.toMagenta('\n' + '-- ' + 'Service Paths Used' + ' --') + '\n');

  let servicePaths = paths.getServicePathsUsed();

  let servicePathNodeNames;
  Object.keys(servicePaths).forEach((servicePathKey) => {
    servicePathNodeNames = servicePaths[servicePathKey];
    print.out(cprint.toWhite('- ' + servicePathKey + ' [\n    ' + servicePathNodeNames.join('\n    ') + '\n]') + '\n');
  });
}

// ******************************
// Exports:
// ******************************

module.exports['serviceStats'] = printServiceStats;
module.exports['servicePathsUsed'] = printServicePathsUsed;

// ******************************