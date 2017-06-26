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

let clone = require('clone');
let Promise = require('bluebird');
let qs = require('querystring');
let request = require('request');
let cprint = require('color-print');

let log = require('./log');
let paths = require('./paths');
let print = require('./print');
let registry = require('./registry');
let timer = require('./timer');
let utils = require('./utils');

// ******************************
// Globals:
// ******************************

let g_CURRENT_REQUESTS = {};

// ******************************
// Functions:
// ******************************

function getAndExecuteServicePath (in_inputs, in_outputType, in_maxTryCount, in_returnAll) {
  return new Promise((resolve, reject) => {
    utils.runGenerator(function* () {
      try {
        let inputs = _cleanInputs(in_inputs);
        let servicePath = yield paths.getServicePath(Object.keys(inputs), in_outputType);
        let result = yield executeServicePath(servicePath, inputs);

        let tryCount = 0;
        let maxTryCount = (in_maxTryCount || 0)

        while (tryCount++ < maxTryCount && (!result || !result[in_outputType]) && registry.hasRegistryChanged()) {
          registry.clearRegistryChanged();
          // registry.clearServiceStats();
          // paths.clearServicePathsUsed();

          log.warning('Trying again...');
          inputs = _cleanInputs(in_inputs);
          servicePath = yield paths.getServicePath(Object.keys(inputs), in_outputType);
          result = yield executeServicePath(servicePath, inputs);
        }

        let outputValue = (result ? utils.getValue(result[in_outputType]) : null);

        if (in_returnAll) {
          resolve(result);
        } else {
          resolve(outputValue);
        }
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ******************************

function executeServicePath (in_servicePath, in_inputs) {
  let allData = clone(_cleanInputs(in_inputs));
  return _executeServicePathNode(in_servicePath.reverse(), allData).then(() => {
    print.clearLine();
    return Promise.resolve(allData);
  });
}

// ******************************

function loadTestServicePath (in_inputs, in_outputType, in_rate, in_duration, in_maxResponseTime) {
  cprint.cyan('Testing path load at a rate of ' + in_rate + '/s for ' + in_duration + 's');

  let rate = Math.max(1, in_rate); // Per second
  let delay = 1000 / rate;
  let iterations = rate;
  let passCount = 0;
  let failCount = 0;
  let slowestResponseTime = -1;
  let fastestResponseTime = -1;
  let totalResonseTime = 0;
  let max

  let doFn = () => {
    let startDate = new Date();
    let inputs = _cleanInputs(in_inputs);
    paths.getServicePath(Object.keys(inputs), in_outputType).then((servicePath) => {
      _executeServicePathNode(clone(servicePath).reverse(), clone(inputs)).then((result) => {

        let responseTime = (new Date() - startDate) / 1000;
        if (!result || (result.length && result[0] === undefined)) {
          failCount++;
        } else if (responseTime > in_maxResponseTime) {
          failCount++;
        } else {
          passCount++;
        }

        let totalCount = passCount + failCount;

        totalResonseTime += responseTime;

        if (slowestResponseTime < 0 || responseTime > slowestResponseTime) {
          slowestResponseTime = responseTime;
        }

        if (fastestResponseTime < 0 || responseTime < fastestResponseTime) {
          fastestResponseTime = responseTime;
        }

        let averageResponseTime = Math.round(totalResonseTime/totalCount * 1000) / 1000;
        let failAverage = Math.round(failCount/totalCount * 1000) / 10;

        let message =
          cprint.toGreen(passCount) + ' ' + cprint.toRed('(-' + failCount + ')')
          + '   '
          + cprint.toGreen('Avg. Fail') + cprint.toWhite(':') + ' ' + cprint.toCyan(failAverage + '%') + cprint.toWhite(',') + ' '
          + cprint.toGreen('Worst') + cprint.toWhite(':') + ' ' + cprint.toCyan(slowestResponseTime + 's') + cprint.toWhite(',') + ' '
          + cprint.toGreen('Avg.') + cprint.toWhite(':') + ' ' + cprint.toCyan(averageResponseTime + 's') + cprint.toWhite(',') + ' '
          + cprint.toGreen('Best') + cprint.toWhite(':') + ' ' + cprint.toCyan(fastestResponseTime + 's') + cprint.toWhite(',');

        message = (message.replace(/(\n|\r\n?)/g, ' ').trim() + ' '.repeat(500)).substr(0, 300);
        print.out('\r' + message);
      });
    });
  };

  var loopFn = (idx) => {
     setTimeout(function () {
        doFn();
        if (--idx > 0) loopFn(idx);
     }, delay)
  };

  let loopCount = 0;
  while(loopCount++ < in_duration) {
    setTimeout(function () {
        loopFn(iterations);
     }, 1000 * (loopCount-1))
  }
}

// ******************************

function _executeServicePathNode (in_servicePath, in_availableInputs, in_lastOutput) {
  let servicePath = in_servicePath;
  let availableInputs = in_availableInputs;

  if (!Object.keys(servicePath).length) {
    return Promise.resolve(in_lastOutput);
  }

  let servicePathNodeRequests = [];

  Object.keys(servicePath).forEach((servicePathKey) => {
    let servicePathNode = servicePath[servicePathKey];
    if (!registry.matchServiceInputTypes(servicePathNode, Object.keys(availableInputs))) {
      return;
    }

    delete servicePath[servicePathKey];

    servicePathNodeRequests.push(_executeServiceAndPopulateInputs(servicePath, servicePathNode, availableInputs));
  });

  return Promise.all(servicePathNodeRequests);
}

// ******************************

function _executeServiceAndPopulateInputs (in_servicePath, in_servicePathNode, in_availableInputs) {
  let availableInputs = in_availableInputs;

  return new Promise((resolve, reject) => {
    _executeService(in_servicePathNode, availableInputs).then((outputValue) => {
      if (!outputValue) {
        return resolve();
      }

      let serviceName = utils.getProperty(in_servicePathNode, 'name');
      let servicePathNodeKey = utils.getProperty(in_servicePathNode, 'key');
      let serviceOutputType = utils.getProperty(in_servicePathNode, 'output');

      let error = utils.getProperty(outputValue, 'error', false);
      let warning = utils.getProperty(outputValue, 'warning', false);

      if (error) {
        log.error(serviceName + ': ' + error);
        registry.disableService(servicePathNodeKey);
        return resolve();
      }

      if (warning) {
        log.warning(serviceName + ': ' + warning);
        registry.disableService(servicePathNodeKey);
        return resolve();
      }

      if (!availableInputs[serviceOutputType] && outputValue) {
        availableInputs[serviceOutputType] = outputValue;
      }

      return _executeServicePathNode(in_servicePath, availableInputs, outputValue).then(resolve).catch(reject);
    }).catch(reject);
  });
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
  let serviceKey = utils.getProperty(in_service, 'key');
  let serviceName = utils.getProperty(in_service, 'name');
  let serviceAddress = utils.getProperty(in_service, 'address');

  log.info('Executing Network Service: ' + serviceName);

  let currentRequestKey = serviceName + ':' + serviceAddress + ':' + utils.keyValToString(in_inputs);
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

    let requestUrl = (ssl ? 'https' : 'http' ) + '://' + address + ':' + port + '/' + serviceOutputApiPath;
    let requestData = {};

    if (serviceRequestData) {
      Object.keys(serviceRequestData).forEach((serviceInputType) => {
        let inputValue = in_inputs[serviceInputType];
        let requestDataInput = utils.getProperty(serviceRequestData, serviceInputType, []);
        let requestDataKey = utils.getProperty(requestDataInput, 'key', serviceInputType);
        let requestDataVal = utils.getProperty(requestDataInput, 'val', inputValue);
        utils.setRequestData(requestData, requestDataKey, requestDataVal);
      });
    } else {
      serviceInputTypes.forEach((serviceInputType) => {
        let inputValue = in_inputs[serviceInputType];
        let urlKeySubstitution = new RegExp('{' + serviceInputType + '}');
        if (requestUrl.match(urlKeySubstitution)) {
          requestUrl = requestUrl.replace(urlKeySubstitution, inputValue);
        }
      });
    }

    let requestOptions;

    if (serviceRequestType === 'POST') {
      requestOptions = {
        uri: requestUrl,
        method: 'POST',
        json: requestData,
        timeout: serviceTimeout,
        headers: serviceRequestHeaders,
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      };
    } else {
      requestOptions = {
        uri: requestUrl + '?' + qs.stringify(requestData),
        method: 'GET',
        timeout: serviceTimeout,
        json: true,
        headers: serviceRequestHeaders,
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      };
    }

    let serviceResult = {};

    timer.start(serviceAddress);

    request(requestOptions, (error, response, body) => {
      let responseTime = timer.stop(serviceAddress);

      log.verbose('Request Data: ' + utils.keyValToString(requestData));
      log.verbose('Request Options: ' + utils.keyValToString(requestOptions));

      log.verbose('Response Error: ' + error);
      log.verbose('Response Body: ' + body);

      if (error) {
        registry.addServiceStats({ service_key: serviceKey, error, request_options: requestOptions, response_time: responseTime });
        serviceResult = { error };

      } else if (!body) {
        registry.addServiceStats({ service_key: serviceKey, error: 'Empty body', request_options: requestOptions, response_time: responseTime });
        serviceResult = { error: 'Empty body' };

      } else if (error = utils.getResponseKeyBody(body, 'error')) {
        registry.addServiceStats({ service_key: serviceKey, error, request_options: requestOptions, response_time: responseTime });
        serviceResult = { error };

      } else if (serviceResponseKey) {
        let serviceResponseBody = utils.getResponseKeyBody(body, serviceResponseKey);

        if (!serviceResponseBody) {
          registry.addServiceStats({ service_key: serviceKey, error: body, request_options: requestOptions, response_time: responseTime });
          serviceResult = { error: 'Response key "' + serviceResponseKey + '" not found in body' };

        } else {
          log.verbose('Response key: ' + utils.keyValToString(serviceResponseBody));
          registry.addServiceStats({ service_key: serviceKey, request_options: requestOptions, response_time: responseTime });
          serviceResult = serviceResponseBody;

        }
      } else {
        log.verbose('Response: ' + utils.keyValToString(body));
        registry.addServiceStats({ service_key: serviceKey, request_options: requestOptions, response_time: responseTime });
        serviceResult = body;
      }

      timer.clear(serviceAddress);

      if (serviceResult === null) {
        registry.addServiceStats({ service_key: serviceKey, warning: 'returned null' });
        serviceResult = { warning: 'returned null' };
      }

      return resolve(serviceResult);
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
  let serviceKey = utils.getProperty(in_service, 'key');
  let serviceName = utils.getProperty(in_service, 'name');

  log.info('Executing Function Service: ' + serviceName);

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

    let serviceFunctionInputs = [];
    serviceInputTypes.forEach((serviceInputType) => {
      serviceFunctionInputs.push(in_inputs[serviceInputType]);
    });

    let serviceResult;

    timer.start(serviceFunctionName);
    try {
      serviceResult = serviceFunction.apply(null, serviceFunctionInputs);
    } catch(error) {
      registry.addServiceStats({ service_key: serviceKey, error });
      resolve({ error });
    }

    let serviceResultPromise;

    if (utils.isPromise(serviceResult)) {
      serviceResultPromise = serviceResult;
    } else {
      serviceResultPromise = Promise.resolve(serviceResult);
    }

    serviceResultPromise.then((serviceResult) => {
      if (serviceResult === null) {
        serviceResult = { warning: 'returned null' };
        registry.addServiceStats({ service_key: serviceKey, warning: 'returned null' });
      } else {
        registry.addServiceStats({ service_key: serviceKey, response_time: timer.stop(serviceFunctionName) });
      }
      timer.clear(serviceFunctionName);
      resolve(serviceResult);
    }).catch((error) => {
      registry.addServiceStats({ service_key: serviceKey, error, response_time: timer.stop(serviceFunctionName) });
      resolve({ error });
    });
  });
}

// ******************************

function _cleanInputs (in_inputs) {
  let cleanInputs = {};
  Object.keys(in_inputs).forEach((inputKey) => {
    if (in_inputs[inputKey] === undefined) {
      return;
    }
    cleanInputs[inputKey] = in_inputs[inputKey];
  });

  cleanInputs['NULL'] = false;

  return cleanInputs;
}

// ******************************
// Exports:
// ******************************

module.exports['getAndExecuteServicePath'] = getAndExecuteServicePath;
module.exports['executeServicePath'] = executeServicePath;
module.exports['loadTestServicePath'] = loadTestServicePath;

// ******************************