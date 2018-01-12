'use strict'; // JS: ES6

// ******************************
//
//
// PATHS
//
//
// ******************************

// ******************************
// Requires:
// ******************************

let Promise = require('bluebird');

let log = require('./log');
let registry = require('./registry');
let utils = require('./utils');

// ******************************
// Globals:
// ******************************

let g_SERVICE_PATHS_USED = {};

// ******************************
// Functions:
// ******************************

function getServicePath (in_inputTypes, in_outputType) {
    log.info('Getting service path for "' + in_inputTypes.join('+') + '":"' + in_outputType + '"...');

    if (in_inputTypes.indexOf(in_outputType) >= 0) {
        return Promise.resolve([]);
    }

    let distances = [];
    in_inputTypes.forEach((inputType) => {
        distances[inputType] = 0;
    });

    let serviceDistanceInfo = {
        availableInputs: in_inputTypes.slice(),
        distances,
        bestServices: [],
        seen: [],
        newInputs: true
    };

    return new Promise((resolve, reject) => {
        _getServicePathForMinDistance(serviceDistanceInfo).then(() => {
            let bestServices = serviceDistanceInfo.bestServices;

            if (bestServices[in_outputType] === undefined) {
                _debugNoPathFound(in_outputType, serviceDistanceInfo.availableInputs);
                resolve([]);
                return;
            }

            log.verbose('  Building path...');

            let servicePath = [];
            let typeStack = [in_outputType];

            while (typeStack.length) {
                let outputType = typeStack.pop();
                if (in_inputTypes.indexOf(outputType) >= 0) {
                    continue;
                }

                if (outputType.match(/\?$/)) {
                    continue;
                }

                let outputService = bestServices[outputType];
                if (!outputService) {
                    log.warning('Not best service for: ' + outputType);
                    break;
                }

                let serviceInputTypes = utils.toArray(utils.getProperty(outputService, 'input', []));

                if (servicePath.indexOf(outputService) >= 0) {
                    delete servicePath[servicePath.indexOf(outputService)];
                }

                servicePath.push(outputService);
                typeStack = typeStack.concat(serviceInputTypes);
            }

            servicePath = servicePath.filter((servicePathNode) => { return !!servicePathNode; } );
            servicePath.reverse();

            _logDistances(serviceDistanceInfo.distances);
            _logServicePath(servicePath);

            let servicePathDistances = {};
            servicePath.forEach((servicePathNode) => {
                servicePathDistances[utils.getProperty(servicePathNode, 'name', '')] = _getServiceDistance(servicePathNode);
            });

            resolve(servicePath);
            _addServicePathUsed(in_outputType, servicePathDistances);
        }).catch(reject);
    });
}

// ******************************

function _getServicePathForMinDistance (in_serviceDistanceInfo) {
    if (in_serviceDistanceInfo.newInputs) {
        in_serviceDistanceInfo.newInputs = false;

        _logDistances(in_serviceDistanceInfo.distances);

        return _calculateServiceDistances(in_serviceDistanceInfo).then(_getServicePathForMinDistance);
    }

    return Promise.resolve(in_serviceDistanceInfo);
}

// ******************************

function _calculateServiceDistances (in_serviceDistanceInfo) {
    let availableInputs = in_serviceDistanceInfo.availableInputs;
    let distances = in_serviceDistanceInfo.distances;
    let bestServices = in_serviceDistanceInfo.bestServices;
    let seen = in_serviceDistanceInfo.seen;

    return new Promise((resolve, reject) => {
        registry.getServices(availableInputs).then((servicesWithInput) => {

            servicesWithInput.forEach((serviceWithInput) => {
                let serviceOutputType = utils.getProperty(serviceWithInput, 'output');
                if (availableInputs.indexOf(serviceOutputType) < 0) {
                    availableInputs.push(serviceOutputType);
                    in_serviceDistanceInfo.newInputs = true;
                }
            });

            servicesWithInput.forEach((serviceWithInput) => {
                let serviceName = utils.getProperty(serviceWithInput, 'name');
                let serviceInputTypes = utils.toArray(utils.getProperty(serviceWithInput, 'input', []));
                let serviceOutputType = utils.getProperty(serviceWithInput, 'output');

                if (seen[serviceName]) {
                    return;
                }

                seen[serviceName] = true;

                if (availableInputs.indexOf(serviceOutputType) < 0) {
                    availableInputs.push(serviceOutputType);
                    in_serviceDistanceInfo.newInputs = true;
                }

                let serviceDistance = _getServiceDistance(serviceWithInput);

                let bestDistance = distances[serviceOutputType];
                bestDistance = (bestDistance === undefined) ? NaN : bestDistance;

                let altDistance = parseInt(serviceDistance);

                if (!in_serviceDistanceInfo.newInputs) {
                    serviceInputTypes = serviceInputTypes.map((serviceInputType) => {
                        if (!serviceInputType.match(/\?$/)) {
                            return serviceInputType;
                        }
                        serviceInputType = serviceInputType.replace(/\?$/,'');
                        return (distances[serviceInputType] !== undefined ? serviceInputType : 'NULL');
                    }).filter((serviceInputType) => {
                        return !!serviceInputType;
                    });

                    serviceWithInput['input'] = serviceInputTypes;
                }

                serviceInputTypes.forEach((serviceInputType) => {
                    if (serviceInputType.match(/\?$/)) {
                        seen[serviceName] = false;
                    }

                    altDistance += distances[serviceInputType];
                });

                log.verbose('  Found neighbour "' + serviceInputTypes.join('+') + '":"' + serviceOutputType + '" => ' + altDistance );

                if (!isNaN(altDistance) && (isNaN(bestDistance) || altDistance < bestDistance)) {
                    distances[serviceOutputType] = altDistance;
                    bestServices[serviceOutputType] = serviceWithInput;

                    log.verbose('  Best distance so far "' + serviceOutputType + '" => ' + altDistance + ' < ' + bestDistance);
                }
            });

            resolve(in_serviceDistanceInfo);
        }).catch(reject);
    });
}

// ******************************

function _getServiceDistance (in_service) {
    let serviceAccuracy = utils.getProperty(in_service, 'accuracy', 100);
    let serviceLatency = utils.getProperty(in_service, 'latency', 0);
    let serviceCost = utils.getProperty(in_service, 'cost', 0);
    return (100 - serviceAccuracy) + serviceLatency + serviceCost + 1;
}

// ******************************

function _logDistances (in_distances) {
    log.verbose('Distances: [\n    ' + Object.keys(in_distances).map((key) => {
        return key + ' => ' + in_distances[key];
    }).join('\n    ') + '\n]');
}

// ******************************

function _logServicePath (in_servicePath) {
    log.verbose('Service Path [\n    ' + in_servicePath.map((servicePathNode) => {
        return utils.getProperty(servicePathNode, 'name', '');
    }).join('\n    ') + '\n]');
}

// ******************************

function _debugNoPathFound (in_outputType, in_availableInputs) {
    registry.getServices(false, in_outputType).then((servicesMatchingOutputType) => {
        log.warning('No path found for output type: ' + in_outputType);

        servicesMatchingOutputType.forEach((serviceMatchingOutputType) => {
            let serviceInputTypes = utils.toArray(utils.getProperty(serviceMatchingOutputType, 'input'));
            let missingInputTypes = serviceInputTypes.filter((inputType) => { return in_availableInputs.indexOf(inputType) < 0; });

            log.warning('- Could match: ' + serviceMatchingOutputType.key);
            log.warning('  But missing input types: ' + missingInputTypes.join(','));
        });
    });
}

// ******************************

function getServicePathsUsed () {
    return g_SERVICE_PATHS_USED;
}

// ******************************

function clearServicePathsUsed () {
    g_SERVICE_PATHS_USED = {};
}

// ******************************

function _addServicePathUsed (in_outputType, in_servicePathDistances) {
    g_SERVICE_PATHS_USED[in_outputType] = in_servicePathDistances;
}

// ******************************
// Exports:
// ******************************

module.exports['clearServicePathsUsed'] = clearServicePathsUsed;
module.exports['getServicePath'] = getServicePath;
module.exports['getServicePathsUsed'] = getServicePathsUsed;

// ******************************