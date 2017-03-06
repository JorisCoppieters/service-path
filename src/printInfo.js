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

  let serviceStats = _sortServiceStats(registry.getServiceStats());
  serviceStats.forEach((serviceStats) => {
    let serviceKey = utils.getProperty(serviceStats, 'service_key', false);
    let service = registry.getService(serviceKey);
    if (!service) {
      return;
    }

    let serviceName = utils.getProperty(service, 'name', false);
    let serviceType = utils.getProperty(service, 'type', false);
    let serviceError = utils.getProperty(serviceStats, 'error');
    let serviceWarning = utils.getProperty(serviceStats, 'warning');
    let serviceResponseTime = parseFloat(utils.getProperty(serviceStats, 'response_time', 0));
    let serviceTypeShort = (serviceType === 'function' ? '[F]' : '[N]');

    if (serviceError) {
      print.out(cprint.toRed('- ' + serviceName + ' (' + serviceKey + '):' + serviceError) + '\n');

      let serviceRequestOptions = utils.getProperty(serviceStats, 'request_options');
      if (serviceRequestOptions) {
        print.out(cprint.toRed('  * URI: ' + serviceRequestOptions.uri + '\n'));
        print.out(cprint.toRed('  * Timeout: ' + serviceRequestOptions.timeout + '\n'));
      }
    } else if (serviceWarning) {
      print.out(cprint.toYellow('- ' + serviceTypeShort + ' ' + serviceName + ' (' + serviceKey + '): ' + serviceWarning) + '\n');
    } else {
      print.out(cprint.toWhite('- ' + serviceTypeShort + ' ' + serviceName + ' (' + serviceKey + ') took ' + serviceResponseTime + 'ms') + '\n');
    }
  });
}

// ******************************

function printServicePathsUsed () {
  print.out(cprint.toMagenta('\n' + '-- ' + 'Service Paths Used' + ' --') + '\n');

  let servicePaths = paths.getServicePathsUsed();

  Object.keys(servicePaths).forEach((servicePathKey) => {
    let servicePathDistances = servicePaths[servicePathKey];
    let servicePathTotalDistance = Object.keys(servicePathDistances).reduce((sum, k) => { return sum + servicePathDistances[k]; }, 0);
    let servicePathNodesWithDistance = Object.keys(servicePathDistances).map((k) => { return k + ' ('+servicePathDistances[k]+')'; });
    print.out(cprint.toWhite('- ' + servicePathKey + ' (' + servicePathTotalDistance + ') [\n    ' + servicePathNodesWithDistance.join('\n    ') + '\n]') + '\n');
  });
}

// ******************************

function _sortServiceStats (in_serviceStats) {
  return in_serviceStats.sort((a, b) => {
    let serviceKey = utils.getProperty(a, 'service_key', false);
    let service = registry.getService(serviceKey);
    if (!service) {
      return -1;
    }

    let compareA = utils.getProperty(service, 'name', false);

    serviceKey = utils.getProperty(b, 'service_key', false);
    service = registry.getService(serviceKey);
    if (!service) {
      return -1;
    }

    let compareB = utils.getProperty(service, 'name', false);

    if (compareA < compareB) { return -1; }
    if (compareA > compareB) { return 1; }
    return 0;
  });
}

// ******************************
// Exports:
// ******************************

module.exports['serviceStats'] = printServiceStats;
module.exports['servicePathsUsed'] = printServicePathsUsed;

// ******************************