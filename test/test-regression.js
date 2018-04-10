'use strict';

// ******************************
// Requires:
// ******************************

const cprint = require('color-print');
const Promise = require('bluebird');

const servicePath = require('../index');
const utils = require('../src/utils');

// ******************************
// Setup:
// ******************************

utils.runGenerator(function *runAllTests() {
    let testResult;

    testResult = yield _runTest('empty test', {
    }, {
    }, [
    ],
    'test', null);
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('single input test', {
    }, {
    }, {
        'test': '123'
    },
    'test', '123');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple matching test', {
        'A__to__B': {
            'type': 'function',
            'input': 'A',
            'output': 'B'
        }
    }, {
    }, {
        'A': '123'
    },
    'B', '123');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple matching test with single input(s)', {
        'A__to__B': {
            'type': 'function',
            'inputs': 'A',
            'output': 'B'
        }
    }, {
    }, {
        'A': '123'
    },
    'B', '123');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple matching test with single input as array', {
        'A__to__B': {
            'type': 'function',
            'input': [ 'A' ],
            'output': 'B'
        }
    }, {
    }, {
        'A': '123'
    },
    'B', '123');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple matching test with single input(s) as array', {
        'A__to__B': {
            'type': 'function',
            'inputs': [ 'A' ],
            'output': 'B'
        }
    }, {
    }, {
        'A': '123'
    },
    'B', '123');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple matching with function test', {
        'A__to__B': {
            'type': 'function',
            'inputs': [ 'A' ],
            'output': 'B'
        }
    }, {
        'A__to__B': () => '345'
    }, {
        'A': '123'
    },
    'B', '345');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple matching (modification) with function test', {
        'A__to__B': {
            'type': 'function',
            'inputs': [ 'A' ],
            'output': 'B'
        }
    }, {
        'A__to__B': (A) => A + A
    }, {
        'A': '123'
    },
    'B', '123123');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple equality test - compare outcome', {
        'switch==on': {
            'type': 'function',
            'input': 'switch',
            'output': 'switch==on'
        },
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'switch==on'
            ],
            'output': 'outcome'
        }
    }, {
    }, {
        'A': '123',
        'switch': 'on'
    },
    'outcome', '123');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple equality test - compare switch', {
        'switch==on': {
            'type': 'function',
            'input': 'switch',
            'output': 'switch==on'
        },
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'switch==on'
            ],
            'output': 'outcome'
        }
    }, {
    }, {
        'A': '123',
        'switch': 'on'
    },
    'switch==on', 'on');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple inequality test - compare outcome', {
        'switch==on': {
            'type': 'function',
            'input': 'switch',
            'output': 'switch==on'
        },
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'switch==on'
            ],
            'output': 'outcome'
        }
    }, {
    }, {
        'A': '123',
        'switch': 'off'
    },
    'outcome', null);
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('simple inequality test - compare switch', {
        'switch==on': {
            'type': 'function',
            'input': 'switch',
            'output': 'switch==on'
        },
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'switch==on'
            ],
            'output': 'outcome'
        }
    }, {
    }, {
        'A': '123',
        'switch': 'off'
    },
    'switch==on', null);
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'B'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'A': '123',
        'B': '456'
    },
    'outcome', '123-456');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with missing first input', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'B'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'C': '123',
        'B': '456'
    },
    'outcome', null);
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with missing second input', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'B'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'A': '123',
        'C': '456'
    },
    'outcome', null);
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with optional first input', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A?',
                'B'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'A': '123',
        'B': '456'
    },
    'outcome', '123-456');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with optional second input', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'B?'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'A': '123',
        'B': '456'
    },
    'outcome', '123-456');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with optional & missing first input', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A?',
                'B'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'C': '123',
        'B': '456'
    },
    'outcome', 'false-456');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with optional & missing second input', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A',
                'B?'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'A': '123',
        'C': '456'
    },
    'outcome', '123-false');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with optional inputs', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A?',
                'B?'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'A': '123',
        'B': '456'
    },
    'outcome', '123-456');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple inputs test with optional & missing inputs', {
        'outcome': {
            'type': 'function',
            'inputs': [
                'A?',
                'B?'
            ],
            'output': 'outcome'
        }
    }, {
        'outcome': (A, B) => A + '-' + B
    }, {
        'C': '123',
        'D': '456'
    },
    'outcome', 'false-false');
    if (!testResult.success) { cprint.red(testResult.error); return; }

    testResult = yield _runTest('multiple path on iteration', {
        'mode==A': {
            'type': 'function',
            'input': 'mode',
            'output': 'mode==A'
        },
        'mode==B': {
            'type': 'function',
            'input': 'mode',
            'output': 'mode==B'
        },
        'value__to__valueA': {
            'type': 'function',
            'inputs': [
                'value',
                'mode==A'
            ],
            'output': 'valueA'
        },
        'value__to__valueB': {
            'type': 'function',
            'inputs': [
                'value',
                'mode==B'
            ],
            'output': 'valueB'
        },
        'valueA__to__outcome': {
            'type': 'function',
            'inputs': 'valueA',
            'output': 'outcome'
        },
        'valueB__to__outcome': {
            'type': 'function',
            'inputs': 'valueB',
            'output': 'outcome'
        }
    }, {
        'value__to__valueA': (value) => value / 5,
        'value__to__valueB': (value) => value / 2
    }, {
        'mode': 'B',
        'value': 10
    },
    'outcome', 5);
    if (!testResult.success) { cprint.red(testResult.error); return; }
});

function _runTest(in_testName, in_registry, in_functions, in_inputs, in_output, in_expectedResult) {
    return new Promise((resolve) => {
        servicePath.clearServiceStats();
        servicePath.clearServicePathsUsed();
        servicePath.clearAllDisabledServices();
        servicePath.setup({
            log_level: servicePath.k_LOG_LEVEL_NONE,
            service_registry: in_registry,
            service_functions: in_functions,
        });

        servicePath.getAndExecuteServicePath(in_inputs, in_output, 1).then(output => {
            if (output === in_expectedResult) {
                resolve({
                    success: true
                });
            } else {
                resolve({
                    success: false,
                    error: `${in_testName}] Unexpected result: ${output}`
                });
            }
        });
    });
}

// ******************************