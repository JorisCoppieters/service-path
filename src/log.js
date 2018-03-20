'use strict'; // JS: ES6

// ******************************
//
//
// LOG
//
//
// ******************************

// ******************************
// Requires:
// ******************************

let cprint = require('color-print');
let print = require('./print');

// ******************************
// Constants:
// ******************************

const k_LOG_LEVEL_ERROR = 1;
const k_LOG_LEVEL_WARNING = 2;
const k_LOG_LEVEL_SUCCESS = 3;
const k_LOG_LEVEL_INFO = 4;
const k_LOG_LEVEL_VERBOSE = 5;

// ******************************
// Globals:
// ******************************

let defaultLogger = {
    error: (in_message) => {
        print.clearLine();
        print.out(cprint.toRed('ERROR: ' + _formatLogMessage(in_message)));
    },
    warning: (in_message) => {
        print.clearLine();
        print.out(cprint.toYellow('WARNING: ' + _formatLogMessage(in_message)));
    },
    success: (in_message) => {
        print.clearLine();
        print.out(cprint.toGreen('SUCCESS: ' + _formatLogMessage(in_message)));
    },
    info: (in_message) => {
        print.clearLine();
        print.out(cprint.toCyan('INFO: ' + _formatLogMessage(in_message)));
    },
    verbose: (in_message) => {
        print.clearLine();
        print.out(cprint.toWhite('VERBOSE: ' + _formatLogMessage(in_message)));
    }
};

// ******************************

let g_LOG_LEVEL = k_LOG_LEVEL_SUCCESS;
let g_LOG_SINGLE_LINE = false;
let g_LOGGER = defaultLogger;

// ******************************
// Functions:
// ******************************

function setLogger (in_logger) {
    g_LOGGER = in_logger || defaultLogger;
}

// ******************************

function setLogLevel (in_logLevel) {
    g_LOG_LEVEL = in_logLevel;
}

// ******************************

function getLogLevel () {
    return g_LOG_LEVEL;
}

// ******************************

function setLogSingleLine (in_logSingleLine) {
    g_LOG_SINGLE_LINE = in_logSingleLine;
}

// ******************************

function getLogSingleLine () {
    return g_LOG_LEVEL;
}

// ******************************

function logError (in_message) {
    if (g_LOG_LEVEL >= k_LOG_LEVEL_ERROR) {
        g_LOGGER.error(in_message);
    }
}

// ******************************

function logWarning (in_message) {
    if (g_LOG_LEVEL >= k_LOG_LEVEL_WARNING) {
        g_LOGGER.warning(in_message);
    }
}

// ******************************

function logSuccess (in_message) {
    if (g_LOG_LEVEL >= k_LOG_LEVEL_SUCCESS) {
        g_LOGGER.success(in_message);
    }
}

// ******************************

function logInfo (in_message) {
    if (g_LOG_LEVEL >= k_LOG_LEVEL_INFO) {
        g_LOGGER.info(in_message);
    }
}

// ******************************

function logVerbose (in_message) {
    if (g_LOG_LEVEL >= k_LOG_LEVEL_VERBOSE) {
        g_LOGGER.verbose(in_message);
    }
}

// ******************************

function _formatLogMessage (in_message) {
    if (!g_LOG_SINGLE_LINE) {
        return in_message + '\n';
    }
    return '\r' + in_message.replace(/(\n|\r\n?)/g, ' ').trim().substr(0, 100);
}

// ******************************
// Exports:
// ******************************

module.exports['k_LOG_LEVEL_ERROR'] = k_LOG_LEVEL_ERROR;
module.exports['k_LOG_LEVEL_WARNING'] = k_LOG_LEVEL_WARNING;
module.exports['k_LOG_LEVEL_SUCCESS'] = k_LOG_LEVEL_SUCCESS;
module.exports['k_LOG_LEVEL_INFO'] = k_LOG_LEVEL_INFO;
module.exports['k_LOG_LEVEL_VERBOSE'] = k_LOG_LEVEL_VERBOSE;

module.exports['error'] = logError;
module.exports['info'] = logInfo;
module.exports['logLevel'] = getLogLevel;
module.exports['logSingleLine'] = getLogSingleLine;
module.exports['setLogger'] = setLogger;
module.exports['setLogLevel'] = setLogLevel;
module.exports['setLogSingleLine'] = setLogSingleLine;
module.exports['success'] = logSuccess;
module.exports['verbose'] = logVerbose;
module.exports['warning'] = logWarning;

// ******************************