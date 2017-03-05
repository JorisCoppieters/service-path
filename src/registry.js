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

let Promise = require('bluebird');
let clone = require('clone');
let utils = require('./utils');
let log = require('./log');

// ******************************
// Globals:
// ******************************

let g_CAN_CONNECT = {};
let g_CURRENT_REQUESTS = {};
let g_SERVICE_REGISTRY = {};
let g_SERVICE_FUNCTIONS = {};
let g_SERVICE_STATS = [];

// ******************************
// Functions:
// ******************************

function setRegistry (in_serviceRegistry) {
  g_SERVICE_REGISTRY = _convertServicesRegistry(in_serviceRegistry);
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
  g_SERVICE_REGISTRY[in_serviceKey].enabled = false;
}

// ******************************

function getService (in_serviceKey) {
  return g_SERVICE_REGISTRY[in_serviceKey];
}

// ******************************

function getServices (in_inputTypes, in_outputType) {
  let matchedServices = [];
  let requests = [];

  let service;
  let serviceKey;
  let request;

  let serviceKeys = Object.keys(g_SERVICE_REGISTRY);
  serviceKeys.forEach((serviceKey) => {
    service = g_SERVICE_REGISTRY[serviceKey];
    request = _matchService(service, in_inputTypes, in_outputType);
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
  let serviceKeys;
  let serviceKey;
  let service;
  let serviceType;

  Object.keys(in_serviceRegistry).forEach((serviceKeys) => {
    service = in_serviceRegistry[serviceKeys];
    serviceKeys.split(/;/).forEach((serviceKey) => {
      service = clone(service);
      service['key'] = serviceKey;
      service['name'] = _getServiceName(service);
      serviceType = utils.getProperty(service, 'type', 'unknown');

      switch (serviceType)
      {
        case 'network':
          service['address'] = serviceKey;
          break;

        case 'function':
          service['function'] = serviceKey;
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

  return new Promise((resolve, reject) => {

    if (!utils.getProperty(in_service, 'enabled', true)) {
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
  let serviceAddress = utils.getProperty(in_service, 'address');
  return new Promise((resolve, reject) => {
    if (g_CAN_CONNECT[serviceAddress] === true) {
      return resolve(in_service);
    } else if (g_CAN_CONNECT[serviceAddress] === false) {
      return resolve(false);
    }

    _canConnect(in_service).then(() => {
      resolve(in_service);
      g_CAN_CONNECT[serviceAddress] = true;

    }).catch((err) => {
      resolve(false);
      g_CAN_CONNECT[serviceAddress] = false;
      log.warning('Cannot connect to: ' + utils.getProperty(in_service, 'name') + ' (' + serviceAddress + ')');
      addServiceStats({ service_key: serviceAddress, warning: 'Cannot connect' });
    });
  });
}

// ******************************

function _matchFunctionService (in_service) {
  return in_service;
}

// ******************************

function _canConnect (in_service) {
  let serviceAddress = utils.getProperty(in_service, 'address');
  let serviceTimeout = utils.getProperty(in_service, 'status_timeout', 250);

  let currentRequestKey = serviceAddress;
  if (g_CURRENT_REQUESTS[currentRequestKey] !== undefined && g_CURRENT_REQUESTS[currentRequestKey].then) {
    return g_CURRENT_REQUESTS[currentRequestKey];
  }

  let address = serviceAddress;
  let port = 80;

  let match = address.match(/(.*):(.*)/);
  if (match) {
    address = match[1];
    port = match[2];
  }

  let serviceStatusApiPath = utils.getProperty(in_service, 'status_api_path');
  if (!serviceStatusApiPath) {
    return Promise.resolve(true);
  }

  let requestUrl = 'http://' + address + ':' + port + '/' + serviceStatusApiPath;

  let requestOptions = {
    uri: requestUrl,
    method: 'GET',
    timeout: serviceTimeout,
  };

  let responseData = {};

  let promise = new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      delete g_CURRENT_REQUESTS[serviceAddress];

      if (error) {
        return reject(error);
      }

      try {
        responseData = JSON.parse(body);
      } catch (error) {
        return reject(error);
      }

      if (['ready', 'ok'].indexOf(responseData.status) >= 0) {
        return resolve('ready');
      }

      if ((responseData.processes || 0) < (responseData.cpu_count || 0)) {
        return resolve('ready');
      }

      return reject('not ready');
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

function getServiceStats () {
  return g_SERVICE_STATS;
}

// ******************************
// Exports:
// ******************************

module.exports['addServiceStats'] = addServiceStats;
module.exports['disableService'] = disableService;
module.exports['getFunction'] = getFunction;
module.exports['getService'] = getService;
module.exports['getServiceStats'] = getServiceStats;
module.exports['getServices'] = getServices;
module.exports['matchServiceInputTypes'] = matchServiceInputTypes;
module.exports['matchServiceOutputType'] = matchServiceOutputType;
module.exports['setFunctions'] = setFunctions;
module.exports['setRegistry'] = setRegistry;

// ******************************