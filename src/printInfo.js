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

const cprint = require('color-print');

const paths = require('./paths');
const print = require('./print');
const registry = require('./registry');
const utils = require('./utils');

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
        let networkService = (serviceType === 'network');
        let serviceTypeShort = (networkService ? '[N]' : '[F]');
        let serviceReference = utils.getProperty(service, networkService ? 'address' : 'function', serviceName);

        if (serviceError) {
            print.out(cprint.toRed('- ' + serviceTypeShort + ' ' + serviceName + ' (' + serviceReference + '):' + serviceError) + '\n');

            let serviceRequestOptions = utils.getProperty(serviceStats, 'request_options');
            if (serviceRequestOptions) {
                print.out(cprint.toRed('  * URI: ' + serviceRequestOptions.uri + '\n'));
                print.out(cprint.toRed('  * Timeout: ' + serviceRequestOptions.timeout + '\n'));
            }
        } else if (serviceWarning) {
            print.out(cprint.toYellow('- ' + serviceTypeShort + ' ' + serviceName + ' (' + serviceReference + '): ' + serviceWarning) + '\n');
        } else {
            print.out(cprint.toWhite('- ' + serviceTypeShort + ' ' + serviceName + ' (' + serviceReference + ') took ' + serviceResponseTime + 's') + '\n');
        }
    });
}

// ******************************

function getServiceStatsHTML () {
    let htmlOutput = '<div class="service-stats">';
    htmlOutput += '<div class="service-stats-title"><p>Service stats</p></div>';
    htmlOutput += '<div class="service-stats-list">';
    htmlOutput += '<ul class="service-stats-list-entries">';

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
        let networkService = (serviceType === 'network');
        let serviceTypeShort = (networkService ? '[N]' : '[F]');
        let serviceReference = utils.getProperty(service, networkService ? 'address' : 'function', serviceName);

        if (serviceError) {
            htmlOutput += '<li class="service-stats-list-entry error">' + serviceTypeShort + ' ' + serviceName + ' (' + serviceReference + '):' + serviceError;

            let serviceRequestOptions = utils.getProperty(serviceStats, 'request_options');
            if (serviceRequestOptions) {
                htmlOutput += '<ul class="service-stats-list-entry-errors">';
                htmlOutput += '<li class="service-stats-list-entry-error">URI: ' + serviceRequestOptions.uri + '</li>';
                htmlOutput += '<li class="service-stats-list-entry-error">Timeout: ' + serviceRequestOptions.timeout + '</li>';
                htmlOutput += '</ul>';
            }

            htmlOutput += '</li>';
        } else if (serviceWarning) {
            htmlOutput += '<li class="service-stats-list-entry warning">' + serviceTypeShort + ' ' + serviceName + ' (' + serviceReference + '): ' + serviceWarning + '</li>';
        } else {
            htmlOutput += '<li class="service-stats-list-entry">' + serviceTypeShort + ' ' + serviceName + ' (' + serviceReference + ') took ' + serviceResponseTime + 's' + '</li>';
        }
    });

    htmlOutput += '</ul></div></div>';
    return htmlOutput;
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

function getServicePathsUsedHTML () {
    let htmlOutput = '<div class="service-paths">';
    htmlOutput += '<div class="service-paths-title"><p>Service paths used</p></div>';
    htmlOutput += '<div class="service-paths-list">';
    htmlOutput += '<ul class="service-paths-list-entries">';

    let servicePaths = paths.getServicePathsUsed();
    Object.keys(servicePaths).forEach((servicePathKey) => {
        let servicePathDistances = servicePaths[servicePathKey];
        let servicePathTotalDistance = Object.keys(servicePathDistances).reduce((sum, k) => { return sum + servicePathDistances[k]; }, 0);
        let servicePathNodesWithDistance = Object.keys(servicePathDistances).map((k) => { return k + ' ('+servicePathDistances[k]+')'; });
        htmlOutput += '<li class="service-paths-list-entry">' + servicePathKey + ' (' + servicePathTotalDistance + ')';
        htmlOutput += '<ul class="service-paths-list-entry-subpath-entries">';
        servicePathNodesWithDistance.forEach((servicePathNodeWithDistance) => {
            htmlOutput += '<li class="service-paths-list-entry-subpath-entry">' + servicePathNodeWithDistance + '</li>';
        });
        htmlOutput += '</ul></li>';
    });

    htmlOutput += '</ul></div></div>';
    return htmlOutput;
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
module.exports['getServiceStatsHTML'] = getServiceStatsHTML;
module.exports['servicePathsUsed'] = printServicePathsUsed;
module.exports['getServicePathsUsedHTML'] = getServicePathsUsedHTML;

// ******************************