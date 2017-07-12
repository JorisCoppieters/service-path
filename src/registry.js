'use strict'; // JS: ES6

// ******************************
//
//
// REGISTRY
//
//
// ******************************

// ******************************
// Requires:
// ******************************

let clone = require('clone');
let Promise = require('bluebird');
let request = require('request');

let log = require('./log');
let utils = require('./utils');

// ******************************
// Globals:
// ******************************

let g_CAN_CONNECT = {};
let g_REGISTRY_CHANGED = false;
let g_CURRENT_REQUESTS = {};
let g_SERVICE_REGISTRY = {};
let g_SERVICE_FUNCTIONS = {};
let g_DISABLE_SERVICES = {};
let g_SERVICE_STATS = [];

// ******************************
// Functions:
// ******************************

function setRegistry (in_serviceRegistry) {
  g_SERVICE_REGISTRY = _convertServicesRegistry(in_serviceRegistry);
}

// ******************************

function hasRegistryChanged () {
  return !!g_REGISTRY_CHANGED;
}

// ******************************

function clearRegistryChanged () {
  g_REGISTRY_CHANGED = undefined;
}

// ******************************

function setFunctions (in_serviceFunctions) {
  g_SERVICE_FUNCTIONS = in_serviceFunctions;
}

// ******************************

function getFunction (in_functionName) {
  return g_SERVICE_FUNCTIONS[in_functionName];
}

// ******************************

function disableService (in_serviceKey) {
  let now = new Date().getTime();

  g_REGISTRY_CHANGED = true;
  g_DISABLE_SERVICES[in_serviceKey] = { expiry: now + 1000 * 60, disabled: true };
}

// ******************************

function clearDisabledServices (in_serviceKey) {
  g_DISABLE_SERVICES = {};
}

// ******************************

function getService (in_serviceKey) {
  return g_SERVICE_REGISTRY[in_serviceKey];
}

// ******************************

function getServices (in_inputTypes, in_outputType) {
  let matchedServices = [];
  let requests = [];

  let serviceKeys = Object.keys(g_SERVICE_REGISTRY);
  serviceKeys.forEach((serviceKey) => {
    let service = g_SERVICE_REGISTRY[serviceKey];
    let request = _matchService(service, in_inputTypes, in_outputType);
    request.then((matched) => {
      if (matched) {
        matchedServices.push(clone(matched));
      }
    });
    requests.push(request);
  });

  return new Promise((resolveAll, reject) => {
    Promise.all(requests).then(() => {
      resolveAll(matchedServices);
    }).catch(reject);
  });
}

// ******************************

function _convertServicesRegistry (in_serviceRegistry) {
  let fn = '_convertServicesRegistry';

  let convertedServicesRegistry = [];

  Object.keys(in_serviceRegistry).forEach((serviceKeys) => {
    let service = in_serviceRegistry[serviceKeys];
    serviceKeys.split(/;/).forEach((serviceKey) => {
      service = clone(service);
      service['key'] = serviceKey;
      service['name'] = _getServiceName(service);
      let serviceType = utils.getProperty(service, 'type', 'unknown');

      switch (serviceType)
      {
        case 'network':
          service['address'] = service['address'] || serviceKey;
          break;

        case 'function':
          service['function'] = service['function'] || serviceKey;
          break;

        default:
          log.warning(fn + ' : Unhandled service type: ' + serviceType);
          break;
      }

      convertedServicesRegistry[serviceKey] = service;
    })
  });

  return convertedServicesRegistry;
}

// ******************************

function _getServiceName (in_service) {
  let serviceInputTypes = utils.toArray(utils.getProperty(in_service, 'input', []));
  let serviceOutputType = utils.getProperty(in_service, 'output');
  return serviceInputTypes.join('+') + '=>' + serviceOutputType;
}

// ******************************

function _matchService (in_service, in_inputTypes, in_outputType) {
  let fn = '_matchService';

  return new Promise((resolve) => {

    if (_serviceDisabled(in_service)) {
      resolve(false);
      return;
    }

    if (in_inputTypes && !matchServiceInputTypes(in_service, in_inputTypes)) {
      resolve(false);
      return;
    }

    if (in_outputType && !matchServiceOutputType(in_service, in_outputType)) {
      resolve(false);
      return;
    }

    let serviceType = utils.getProperty(in_service, 'type', false);
    switch (serviceType)
    {
      case 'network':
        resolve(_matchNetworkService(in_service));
        break;

      case 'function':
        resolve(_matchFunctionService(in_service));
        break;

      default:
        log.warning(fn + ' : Unhandled service type: ' + serviceType);
        resolve(false);
        break;
    }
  });
}

// ******************************

function _serviceDisabled (in_service) {
  if (!utils.getProperty(in_service, 'enabled', true)) {
    return true;
  }

  let now = new Date().getTime();

  let serviceKey = utils.getProperty(in_service, 'key', false);
  if (g_DISABLE_SERVICES[serviceKey]) {
    let disabledServiceData = g_DISABLE_SERVICES[serviceKey];
    if (disabledServiceData.expiry < now) {
      delete g_DISABLE_SERVICES[serviceKey];
    } else {
      if (disabledServiceData.disabled === true) {
        return true;
      }
    }
  }

  return false;
}

// ******************************

function matchServiceInputTypes (in_service, in_inputTypes) {
  let serviceInputTypes = utils.toArray(utils.getProperty(in_service, 'input', []));
  serviceInputTypes = serviceInputTypes.filter((serviceInputType) => { return !serviceInputType.match(/\?$/); });

  let availableInputTypes = utils.toArray(in_inputTypes);
  let result = utils.arrayContainedIn(serviceInputTypes, availableInputTypes);
  return result;
}

// ******************************

function matchServiceOutputType (in_service, in_outputType) {
  let serviceOutputType = utils.getProperty(in_service, 'output', false);
  return (serviceOutputType && serviceOutputType === in_outputType);
}

// ******************************

function _matchNetworkService (in_service) {
  let serviceKey = utils.getProperty(in_service, 'key');
  let serviceName = utils.getProperty(in_service, 'name');
  let serviceAddress = utils.getProperty(in_service, 'address');
  let now = new Date().getTime();

  return new Promise((resolve, reject) => {
    if (g_CAN_CONNECT[serviceAddress]) {
      let canConnectData = g_CAN_CONNECT[serviceAddress];
      if (canConnectData.expiry < now) {
        delete g_CAN_CONNECT[serviceAddress];
      } else {
        if (canConnectData.canConnect === true) {
          return resolve(in_service);
        } else if (canConnectData.canConnect === false) {
          return resolve(false);
        }
      }
    }

    _canConnect(in_service).then((canConnect) => {
      if (canConnect) {
        resolve(in_service);
        g_CAN_CONNECT[serviceAddress] = { expiry: now + 1000 * 60, canConnect: true };
      } else {
        g_CAN_CONNECT[serviceAddress] = { expiry: now + 1000 * 60, canConnect: false };
        log.warning('Cannot connect to: ' + utils.getProperty(in_service, 'name') + ' (' + serviceAddress + ')');
        addServiceStats({ service_key: serviceKey, warning: 'Cannot connect' });
      }
      resolve(false);
    }).catch(reject);
  });
}

// ******************************

function _matchFunctionService (in_service) {
  return in_service;
}

// ******************************

function _canConnect (in_service) {
  let fn = '_canConnect';
  let serviceName = utils.getProperty(in_service, 'name');
  let serviceAddress = utils.getProperty(in_service, 'address');
  let serviceTimeout = utils.getProperty(in_service, 'status_timeout', 250);

  let currentRequestKey = serviceName + ':' + serviceAddress;
  if (g_CURRENT_REQUESTS[currentRequestKey] !== undefined && g_CURRENT_REQUESTS[currentRequestKey].then) {
    return g_CURRENT_REQUESTS[currentRequestKey];
  }

  let serviceStatusApiPath = utils.getProperty(in_service, 'status_api_path');
  if (!serviceStatusApiPath) {
    return Promise.resolve(true);
  }

  let address = serviceAddress;
  let port = -1;
  let ssl = false;

  let match;

  match = address.match(/(http(s?):\/\/)(.*)/);
  if (match) {
    address = match[3];
    ssl = match[2] === 's';
  }

  match = address.match(/(.*):(.*)/);
  if (match) {
    address = match[1];
    port = match[2];
  }

  if (port === -1) {
    port = (ssl) ? 443 : 80;
  }

  let requestUrl = (ssl ? 'https' : 'http' ) + '://' + address + ':' + port + '/' + serviceStatusApiPath;

  let requestOptions = {
    uri: requestUrl,
    method: 'GET',
    timeout: serviceTimeout,
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  };

  let responseData = {};

  let promise = new Promise((resolve) => {
    request(requestOptions, (error, response, body) => {
      log.verbose('Request Options: ' + utils.keyValToString(requestOptions));
      log.verbose('Response Error: ' + error);
      log.verbose('Response Body: ' + utils.toShortString(body));

      delete g_CURRENT_REQUESTS[currentRequestKey];

      if (error) {
        log.warning(fn + ' : Cannot connect to service: ' + error);
        return resolve(false);
      }

      try {
        responseData = JSON.parse(body);
      } catch (error) {
        log.warning(fn + ' : Cannot parse service status response: ' + error);
        return resolve(false);
      }

      if (['ready', 'ok'].indexOf(responseData.status) >= 0) {
        return resolve(true);
      }

      if ((responseData.processes || 0) < (responseData.cpu_count || 0)) {
        return resolve(true);
      }

      return resolve(false);
    });
  });

  g_CURRENT_REQUESTS[currentRequestKey] = promise;
  promise
    .then(() => { delete g_CURRENT_REQUESTS[currentRequestKey]; })
    .catch(() => { delete g_CURRENT_REQUESTS[currentRequestKey]; });
  return promise;
}

// ******************************

function addServiceStats (in_serviceStats) {
  g_SERVICE_STATS.push(in_serviceStats);
}

// ******************************

function clearServiceStats () {
  g_SERVICE_STATS = [];
}

// ******************************

function getServiceStats () {
  return g_SERVICE_STATS;
}

// ******************************
// Exports:
// ******************************

module.exports['addServiceStats'] = addServiceStats;
module.exports['clearRegistryChanged'] = clearRegistryChanged;
module.exports['clearServiceStats'] = clearServiceStats;
module.exports['clearDisabledServices'] = clearDisabledServices;
module.exports['disableService'] = disableService;
module.exports['getFunction'] = getFunction;
module.exports['getService'] = getService;
module.exports['getServices'] = getServices;
module.exports['getServiceStats'] = getServiceStats;
module.exports['hasRegistryChanged'] = hasRegistryChanged;
module.exports['matchServiceInputTypes'] = matchServiceInputTypes;
module.exports['matchServiceOutputType'] = matchServiceOutputType;
module.exports['setFunctions'] = setFunctions;
module.exports['setRegistry'] = setRegistry;

// ******************************