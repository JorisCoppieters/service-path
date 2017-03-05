'use strict'; // JS: ES6

// ******************************
//
//
// EXECUTION
//
//
// ******************************

// ******************************
// Requires:
// ******************************

let qs = require('querystring');
let request = require('request');
let Promise = require('bluebird');

let log = require('./log');
let registry = require('./registry');
let utils = require('./utils');
let timer = require('./timer');

// ******************************
// Globals:
// ******************************

let g_CURRENT_REQUESTS = {};

// ******************************
// Functions:
// ******************************

function executeServicePath (in_servicePath, in_inputs) {
  let allData = in_inputs;
  return _executeServicePathNode(in_servicePath.reverse(), allData).then(() => {
    return Promise.resolve(allData);
  });
}

// ******************************

function _executeServicePathNode (in_servicePath, in_availableInputs) {
  let servicePath = in_servicePath;
  let availableInputs = in_availableInputs;

  if (!Object.keys(servicePath).length) {
    return Promise.resolve();
  }

  let servicePathNode;
  let servicePathNodeKey;
  let servicePathNodeRequest;
  let servicePathNodeRequests = [];

  Object.keys(servicePath).forEach((servicePathKey) => {
    servicePathNode = servicePath[servicePathKey];
    if (!registry.matchServiceInputTypes(servicePathNode, Object.keys(availableInputs))) {
      return;
    }

    delete servicePath[servicePathKey];

    servicePathNodeRequests.push(new Promise((resolve, reject) => {
      _executeService(servicePathNode, availableInputs).then((output) => {
        if (!output) {
          return resolve();
        }

        let serviceName = utils.getProperty(servicePathNode, 'name');
        let servicePathNodeKey = utils.getProperty(servicePathNode, 'key');

        let outputType = Object.keys(output)[0];
        let outputValue = output[outputType];

        if (!availableInputs[outputType] && outputValue) {
          availableInputs[outputType] = outputValue;
        }

        let error = utils.getProperty(outputValue, 'error', false);
        let warning = utils.getProperty(outputValue, 'warning', false);

        if (error) {
          log.error(serviceName + ': ' + error);
          registry.disableService(servicePathNodeKey);
          return resolve();
        }

        if (warning) {
          log.warning(serviceName + ': ' + warning);
          disableService(servicePathNodeKey);
          return resolve();
        }

        return _executeServicePathNode(servicePath, availableInputs, output).then(resolve).catch(reject);
      }).catch(reject);
    }));
  });

  return Promise.all(servicePathNodeRequests);
}

// ******************************

function _executeService (in_service, in_inputs) {
  let fn = '_executeService';

  let serviceType = utils.getProperty(in_service, 'type', false);
  switch (serviceType)
  {
    case 'network':
      return _executeNetworkService(in_service, in_inputs);

    case 'function':
      return _executeFunctionService(in_service, in_inputs);

    default:
      log.warning(fn + ' : Unhandled service type: ' + serviceType);
      return Promise.resolve(false);
  }
}

// ******************************

function _executeNetworkService (in_service, in_inputs) {
  let serviceName = utils.getProperty(in_service, 'name');
  let serviceAddress = utils.getProperty(in_service, 'address');

  log.info('Executing Network Service: ' + serviceName);

  let currentRequestKey = serviceAddress + ':' + utils.inputsToString(in_inputs);
  if (g_CURRENT_REQUESTS[currentRequestKey] !== undefined && g_CURRENT_REQUESTS[currentRequestKey].then) {
    return g_CURRENT_REQUESTS[currentRequestKey];
  }

  let promise = new Promise((resolve, reject) => {
    let serviceInputTypes = utils.toArray(utils.getProperty(in_service, 'input', []));
    let serviceOutputType = utils.getProperty(in_service, 'output');
    let serviceOutputApiPath = utils.getProperty(in_service, 'output_api_path');
    let serviceRequestType = utils.getProperty(in_service, 'request_type');
    let serviceRequestData = utils.getProperty(in_service, 'request_data');
    let serviceRequestHeaders = utils.getProperty(in_service, 'headers');
    let serviceResponseKey = utils.getProperty(in_service, 'response_key', false);
    let serviceTimeout = utils.getProperty(in_service, 'output_timeout', 1000);

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

    let inputValue;
    let inputsValid = true;

    let requestUrl = (ssl ? 'https' : 'http' ) + '://' + address + ':' + port + '/' + serviceOutputApiPath;
    let requestData = {};
    let requestDataInput;
    let requestDataKey;
    let requestDataCheckFunction;
    let requestDataCheckFunctionName;
    let requestDataEncodeFunction;
    let requestDataEncodeFunctionName;

    serviceInputTypes.forEach((serviceInputType) => {
      if (!inputsValid) {
        return;
      }

      inputValue = in_inputs[serviceInputType];
      requestDataInput = utils.getProperty(serviceRequestData, serviceInputType, []);
      requestDataKey = utils.getProperty(requestDataInput, 'key', serviceInputType);

      requestDataCheckFunctionName = utils.getProperty(requestDataInput, 'check_function', false);
      if (requestDataCheckFunctionName) {
        requestDataCheckFunction = registry.getFunction(requestDataCheckFunctionName);
        if (!requestDataCheckFunction) {
          log.warning('Cannot find function: ' + requestDataCheckFunctionName);
        } else {
          inputsValid = inputsValid && !requestDataCheckFunction(inputValue);
          if (!inputsValid) {
            return;
          }
        }
      }

      requestDataEncodeFunctionName = utils.getProperty(requestDataInput, 'encode_function', false);
      if (requestDataEncodeFunctionName) {
        requestDataEncodeFunction = registry.getFunction(requestDataEncodeFunctionName);
        if (!requestDataEncodeFunction) {
          log.warning('Cannot find function: ' + requestDataEncodeFunctionName);
        } else {
          inputValue = requestDataEncodeFunction(inputValue);
        }
      }

      utils.setRequestData(requestData, requestDataKey, inputValue);
    });

    if (!inputsValid) {
      resolve(false);
      return;
    }

    let responseData = {};
    let requestOptions;

    if (serviceRequestType === 'POST') {
      requestOptions = {
        uri: requestUrl,
        method: 'POST',
        json: requestData,
        timeout: serviceTimeout,
        headers: serviceRequestHeaders,
      };
    } else {
      requestOptions = {
        uri: requestUrl + '?' + qs.stringify(requestData),
        method: 'GET',
        timeout: serviceTimeout,
        json: true,
        headers: serviceRequestHeaders,
      };
    }

    let result = {};

    timer.start(serviceAddress);

    request(requestOptions, (error, response, body) => {
      if (error) {
        log.error(serviceAddress + ' Error:' + error);
        registry.addServiceStats({ service_key: serviceAddress, error, request_options: requestOptions, response_time: timer.stop(serviceAddress) });
        result[serviceOutputType] = { error };
      } else if (serviceResponseKey) {
        let serviceResponseBody = utils.getResponseKeyBody(body, serviceResponseKey);
        if (!serviceResponseBody) {
          log.error(serviceAddress + ' Error:' + body);
          registry.addServiceStats({ service_key: serviceAddress, error: body, request_options: requestOptions, response_time: timer.stop(serviceAddress) });
          result[serviceOutputType] = { error: body };
        } else {
          registry.addServiceStats({ service_key: serviceAddress, request_options: requestOptions, response_time: timer.stop(serviceAddress) });
          result[serviceOutputType] = serviceResponseBody;
        }
      } else {
        registry.addServiceStats({ service_key: serviceAddress, request_options: requestOptions, response_time: timer.stop(serviceAddress) });
        result[serviceOutputType] = body;
      }

      timer.clear(serviceAddress);

      return resolve(result);
    });
  });

  g_CURRENT_REQUESTS[currentRequestKey] = promise;
  promise
    .then(() => { delete g_CURRENT_REQUESTS[currentRequestKey]; })
    .catch(() => { delete g_CURRENT_REQUESTS[currentRequestKey]; });
  return promise;
}

// ******************************

function _executeFunctionService (in_service, in_inputs) {
  log.info('Executing Function Service: ' + utils.getProperty(in_service, 'name'));

  return new Promise((resolve, reject) => {
    let serviceInputTypes = utils.toArray(utils.getProperty(in_service, 'input', []));
    let serviceOutputType = utils.getProperty(in_service, 'output');
    let serviceFunctionName = utils.getProperty(in_service, 'function');
    let serviceFunction = registry.getFunction(serviceFunctionName);
    if (!serviceFunction) {
      log.warning('Cannot find function: ' + serviceFunctionName);
      resolve(false);
      return;
    }

    let serviceFunctionResult;

    timer.start(serviceFunctionName);
    try {
      serviceFunctionResult = serviceFunction(in_inputs);
      registry.addServiceStats({ service_key: serviceFunctionName, response_time: timer.stop(serviceFunctionName) });
    } catch(error) {
      log.error(serviceFunctionName + ' Error:' + error);
      registry.addServiceStats({ service_key: serviceFunctionName, error });
      serviceFunctionResult = false;
    }
    timer.clear(serviceFunctionName);

    let result = {};
    result[serviceOutputType] = serviceFunctionResult;
    resolve(result);
  });
}

// ******************************
// Exports:
// ******************************

module.exports['executeServicePath'] = executeServicePath;

// ******************************