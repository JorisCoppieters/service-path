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

const Promise = require('bluebird');
const cprint = require('color-print');

const log = require('./log');
const paths = require('./paths');
const print = require('./print');
const registry = require('./registry');
const timer = require('./timer');
const utils = require('./utils');

// ******************************
// Globals:
// ******************************

let g_CURRENT_REQUESTS = {};
let g_RANDOM_DATA = {};

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
                let maxTryCount = (in_maxTryCount || 0);

                while (tryCount++ < maxTryCount && (!result || !result[in_outputType]) && registry.hasRegistryChanged()) {
                    registry.clearRegistryChanged();
                    // registry.clearServiceStats();
                    // paths.clearServicePathsUsed();

                    log.warning('Trying again...');
                    inputs = _cleanInputs(result);
                    servicePath = yield paths.getServicePath(Object.keys(inputs), in_outputType);
                    result = yield executeServicePath(servicePath, inputs);
                }

                registry.clearIgnoredServices();

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
    const clone = require('clone');
    let allData = clone(_cleanInputs(in_inputs));
    return _executeServicePathNode(in_servicePath.reverse(), allData).then(() => {
        print.clearLine();
        return Promise.resolve(allData);
    });
}

// ******************************

function printLoadTestServicePath (in_inputs, in_outputType, in_rate, in_duration, in_maxResponseTime, in_doneCb) {
    loadTestServicePath(in_inputs, in_outputType, in_rate, in_duration, in_maxResponseTime, function (in_rate, in_duration){
        cprint.cyan('Testing path load at a rate of ' + in_rate + '/s for ' + in_duration + 's');
    }, function (in_passCount, in_failCount, in_failAverage, in_slowestResponseTime, in_averageResponseTime, in_fastestResponseTime){
        let message =
      cprint.toGreen(in_passCount) + ' ' + cprint.toRed('(-' + in_failCount + ')')
      + '   '
      + cprint.toLightGray('Avg. Fail') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_failAverage + '%') + cprint.toWhite(',') + ' '
      + cprint.toLightGray('Worst') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_slowestResponseTime + 's') + cprint.toWhite(',') + ' '
      + cprint.toLightGray('Avg.') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_averageResponseTime + 's') + cprint.toWhite(',') + ' '
      + cprint.toLightGray('Best') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_fastestResponseTime + 's') + cprint.toWhite(',');

        message = (message.replace(/(\n|\r\n?)/g, ' ').trim() + ' '.repeat(500)).substr(0, 300);
        print.out('\r' + message);
    }, function (in_passCount, in_failCount, in_failAverage, in_slowestResponseTime, in_averageResponseTime, in_fastestResponseTime){
        let message =
      cprint.toGreen(in_passCount) + ' ' + cprint.toRed('(-' + in_failCount + ')')
      + '   '
      + cprint.toGreen('Avg. Fail') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_failAverage + '%') + cprint.toWhite(',') + ' '
      + cprint.toGreen('Worst') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_slowestResponseTime + 's') + cprint.toWhite(',') + ' '
      + cprint.toGreen('Avg.') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_averageResponseTime + 's') + cprint.toWhite(',') + ' '
      + cprint.toGreen('Best') + cprint.toWhite(':') + ' ' + cprint.toCyan(in_fastestResponseTime + 's') + cprint.toWhite(',');

        message = (message.replace(/(\n|\r\n?)/g, ' ').trim() + ' '.repeat(500)).substr(0, 300);
        print.out('\r' + message + '\n');
        if (in_doneCb) {
            in_doneCb();
        }
    });
}

// ******************************

function loadTestServicePath (in_inputs, in_outputType, in_rate, in_duration, in_maxResponseTime, in_startCb, in_iterationCb, in_stopCb) {
    let rate = Math.max(1, in_rate); // Per second
    let delay = 1000 / rate;
    let iterations = rate;
    let passCount = 0;
    let failCount = 0;
    let slowestResponseTime = -1;
    let fastestResponseTime = -1;
    let totalResonseTime = 0;
    let seenLast = false;

    const clone = require('clone');

    if (in_startCb) {
        in_startCb(in_rate, in_duration);
    }

    let doFn = (last) => {
        let startDate = new Date();
        let inputs = _cleanInputs(in_inputs);
        registry.clearAllDisabledServices();
        paths.getServicePath(Object.keys(inputs), in_outputType).then((servicePath) => {
            _executeServicePathNode(clone(servicePath).reverse(), clone(inputs)).then((result) => {
                if (!last && seenLast) {
                    return;
                }

                let output;
                if (result) {
                    output = result[in_outputType];
                    if (output && output.length && output[0] === undefined) {
                        output = undefined;
                    }
                }

                let responseTime = (new Date() - startDate) / 1000;
                if (!output) {
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
                if (in_iterationCb) {
                    if (last) {
                        seenLast = true;
                        in_stopCb(passCount, failCount, failAverage, slowestResponseTime, averageResponseTime, fastestResponseTime);
                    } else {
                        in_iterationCb(passCount, failCount, failAverage, slowestResponseTime, averageResponseTime, fastestResponseTime);
                    }
                }
            });
        });
    };

    var loopFn = (idx, lastLoop) => {
        let lastIteration = lastLoop && idx === 1;
        setTimeout(function () {
            doFn(lastIteration);
            if (--idx > 0) loopFn(idx, lastLoop);
        }, delay);
    };

    let loopCount = 0;
    while(loopCount++ < in_duration) {
        let lastLoop = loopCount >= in_duration;
        setTimeout(function () {
            loopFn(iterations, lastLoop);
        }, 1000 * (loopCount-1));
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
        if (!registry.matchServiceInputTypes(servicePathNode, Object.keys(availableInputs), true)) {
            return;
        }

        delete servicePath[servicePathKey];
        servicePathNodeRequests.push(_executeServiceAndPopulateInputs(servicePath, servicePathNode, availableInputs));
    });

    // if (!servicePathNodeRequests.length) {
    //     Object.keys(servicePath).forEach((servicePathKey) => {
    //         let servicePathNode = servicePath[servicePathKey];
    //         if (!registry.matchServiceInputTypes(servicePathNode, Object.keys(availableInputs))) {
    //             return;
    //         }

    //         delete servicePath[servicePathKey];
    //         servicePathNodeRequests.push(_executeServiceAndPopulateInputs(servicePath, servicePathNode, availableInputs));
    //     });
    // }

    return Promise.all(servicePathNodeRequests)
        .then(() => {
            return Promise.resolve(in_availableInputs);
        });
}

// ******************************

function _executeServiceAndPopulateInputs (in_servicePath, in_servicePathNode, in_availableInputs) {
    let availableInputs = in_availableInputs;

    return new Promise((resolve, reject) => {
        _executeService(in_servicePathNode, availableInputs).then((outputValue) => {
            if (utils.isNullOrUndefined(outputValue)) {
                return resolve();
            }

            let serviceName = utils.getProperty(in_servicePathNode, 'name');
            let servicePathNodeKey = utils.getProperty(in_servicePathNode, 'key');
            let serviceOutputType = utils.getProperty(in_servicePathNode, 'output');
            let serviceType = utils.getProperty(in_servicePathNode, 'type', false);

            let error = utils.getProperty(outputValue, 'error', false);
            let warning = utils.getProperty(outputValue, 'warning', false);
            let remove = utils.getProperty(outputValue, 'remove', false);

            if (remove && serviceType === 'function') {
                registry.ignoreService(servicePathNodeKey);
                return resolve();
            }

            if (error) {
                log.error(serviceName + ': ' + error);
                registry.pauseService(servicePathNodeKey);
                return resolve();
            }

            if (warning) {
                log.warning(serviceName + ': ' + warning);
                registry.pauseService(servicePathNodeKey);
                return resolve();
            }

            if (utils.isNullOrUndefined(availableInputs[serviceOutputType])) {
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

    let promise = new Promise((resolve) => {
        let serviceInputTypes = utils.toArray(utils.getProperty(in_service, 'input', []));
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
                let requestDataValType = utils.getProperty(requestDataInput, 'type', 'string');
                utils.setRequestData(requestData, requestDataKey, requestDataVal, requestDataValType);
            });
        } else {
            serviceInputTypes.forEach((serviceInputType) => {
                let inputValue = in_inputs[serviceInputType];
                let urlKeySubstitution = new RegExp('{' + serviceInputType + '}');
                if (requestUrl.match(urlKeySubstitution)) {
                    requestUrl = requestUrl.replace(urlKeySubstitution, inputValue);
                }

                let requestDataKey = serviceInputType;
                let requestDataVal = inputValue;
                let requestDataValType = 'string';
                utils.setRequestData(requestData, requestDataKey, requestDataVal, requestDataValType);
            });
        }

        let requestOptions;

        if (serviceRequestType === 'POST') {
            requestOptions = {
                uri: requestUrl,
                method: 'POST',
                json: requestData,
                followAllRedirects: true,
                timeout: serviceTimeout,
                headers: serviceRequestHeaders,
                rejectUnauthorized: false,
                requestCert: true,
                agent: false
            };
        } else {
            const qs = require('querystring');
            requestOptions = {
                uri: requestUrl + '?' + qs.stringify(requestData),
                method: 'GET',
                json: true,
                followAllRedirects: true,
                timeout: serviceTimeout,
                headers: serviceRequestHeaders,
                rejectUnauthorized: false,
                requestCert: true,
                agent: false
            };
        }

        let serviceResult = {};

        timer.start(serviceAddress);

        const request = require('request');

        request(requestOptions, (error, response, body) => {
            let responseTime = timer.stop(serviceAddress);

            log.verbose('Request Data: ' + utils.keyValToString(requestData));
            log.verbose('Request Options: ' + utils.keyValToString(requestOptions));

            log.verbose('Response Error: ' + error);
            log.verbose('Response Body: ' + utils.toShortString(body));

            if (error) {
                registry.addServiceStats({ service_key: serviceKey, error, request_options: requestOptions, response_time: responseTime });
                serviceResult = { error };

            } else if (!body) {
                registry.addServiceStats({ service_key: serviceKey, error: 'Empty body', request_options: requestOptions, response_time: responseTime });
                serviceResult = { error: 'Empty body' };

            } else if (utils.getResponseKeyBody(body, 'error')) {
                error = utils.getResponseKeyBody(body, 'error');
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

    return new Promise((resolve) => {
        let serviceInputTypes = utils.toArray(utils.getProperty(in_service, 'input', []));
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
                serviceResult = { remove: true };
                // serviceResult = { warning: 'returned null' };
                // registry.addServiceStats({ service_key: serviceKey, warning: 'returned null' });
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

    let randomPrimaryKey = Object.keys(in_inputs).filter(inputKey => in_inputs[inputKey] === '%RANDOM_PRIMARY%').find(() => true);
    let randomSecondaryKeys = Object.keys(in_inputs).filter(inputKey => in_inputs[inputKey] === '%RANDOM_SECONDARY%');

    if (randomPrimaryKey && randomSecondaryKeys) {
        let randomInputs = _getRandomGroupInputValues(randomPrimaryKey, randomSecondaryKeys);
        Object.keys(randomInputs).forEach(inputKey => {
            in_inputs[inputKey] = randomInputs[inputKey];
        });
    }

    Object.keys(in_inputs).forEach(inputKey => {
        if (in_inputs[inputKey] === undefined) {
            return;
        }
        if (in_inputs[inputKey] === '%RANDOM%') {
            let randomValue = _getRandomInputValue(inputKey);
            cleanInputs[inputKey] = randomValue;
            return;
        }
        cleanInputs[inputKey] = in_inputs[inputKey];
    });

    cleanInputs['NULL'] = false;

    return cleanInputs;
}

// ******************************

function _getRandomInputValue (in_inputKey) {
    let randomDataKey = in_inputKey.toUpperCase();
    let randomData = g_RANDOM_DATA[randomDataKey];
    if (!randomData) {
        return 'NULL';
    }

    let randomIdx = Math.floor(Math.random() * randomData.length);
    return randomData[randomIdx];
}

// ******************************

function _getRandomInputLookupValue (in_inputKey, in_lookupKey, in_lookupValue) {
    let randomDataKey = in_inputKey.toUpperCase() + '->' + in_lookupKey.toUpperCase();
    let randomData = g_RANDOM_DATA[randomDataKey];
    if (!randomData || !randomData[in_lookupValue]) {
        return 'NULL';
    }

    return randomData[in_lookupValue];
}

// ******************************

function _getRandomGroupInputValues (in_primaryInputKey, in_secondaryInputKeys) {
    let groupValues = {};
    let primaryRandomValue = _getRandomInputValue(in_primaryInputKey);
    if (primaryRandomValue) {
        groupValues[in_primaryInputKey] = primaryRandomValue;

        in_secondaryInputKeys.forEach(key => {
            let secondaryLookupValue = _getRandomInputLookupValue(in_primaryInputKey, key, primaryRandomValue);
            if (secondaryLookupValue) {
                groupValues[key] = secondaryLookupValue;
            }
        });
    }

    return groupValues;
}

// ******************************

function setRandomData (in_key, in_data) {
    g_RANDOM_DATA[in_key] = in_data;
}

// ******************************
// Exports:
// ******************************

module.exports['setRandomData'] = setRandomData;
module.exports['getAndExecuteServicePath'] = getAndExecuteServicePath;
module.exports['executeServicePath'] = executeServicePath;
module.exports['loadTestServicePath'] = loadTestServicePath;
module.exports['printLoadTestServicePath'] = printLoadTestServicePath;

// ******************************