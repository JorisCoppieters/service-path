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

runTests([
    {
        name:'empty test',
        registry: {},
        functions: {},
        inputs: [],
        output: 'test',
        expectedResult: null
    },{
        name:'single input test',
        registry: {},
        functions: {},
        inputs: {
            'test': '123'
        },
        output: 'test',
        expectedResult: '123'
    },{
        name:'simple matching test',
        registry: {
            'A__to__B': {
                'type': 'function',
                'input': 'A',
                'output': 'B'
            }
        },
        functions: {},
        inputs: {
            'A': '123'
        },
        output: 'B',
        expectedResult: '123'
    },{
        name:'simple matching test with single input(s)',
        registry: {
            'A__to__B': {
                'type': 'function',
                'inputs': 'A',
                'output': 'B'
            }
        },
        functions: {},
        inputs: {
            'A': '123'
        },
        output: 'B',
        expectedResult: '123'
    },{
        name:'simple matching test with single input as array',
        registry: {
            'A__to__B': {
                'type': 'function',
                'input': [ 'A' ],
                'output': 'B'
            }
        },
        functions: {},
        inputs: {
            'A': '123'
        },
        output: 'B',
        expectedResult: '123'
    },{
        name:'simple matching test with single input(s) as array',
        registry: {
            'A__to__B': {
                'type': 'function',
                'inputs': [ 'A' ],
                'output': 'B'
            }
        },
        functions: {},
        inputs: {
            'A': '123'
        },
        output: 'B',
        expectedResult: '123'
    },{
        name:'simple matching with function test',
        registry: {
            'A__to__B': {
                'type': 'function',
                'inputs': [ 'A' ],
                'output': 'B'
            }
        },
        functions: {
            'A__to__B': () => '345'
        },
        inputs: {
            'A': '123'
        },
        output: 'B',
        expectedResult: '345'
    },{
        name:'simple matching (modification) with function test',
        registry: {
            'A__to__B': {
                'type': 'function',
                'inputs': [ 'A' ],
                'output': 'B'
            }
        },
        functions: {
            'A__to__B': (A) => A + A
        },
        inputs: {
            'A': '123'
        },
        output: 'B',
        expectedResult: '123123'
    },{
        name:'simple equality test - compare outcome',
        registry: {
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
        },
        functions: {},
        inputs: {
            'A': '123',
            'switch': 'on'
        },
        output: 'outcome',
        expectedResult: '123'
    },{
        name:'simple equality test - compare switch',
        registry: {
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
        },
        functions: {},
        inputs: {
            'A': '123',
            'switch': 'on'
        },
        output: 'switch==on',
        expectedResult: 'on'
    },{
        name:'simple inequality test - compare outcome',
        registry: {
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
        },
        functions: {},
        inputs: {
            'A': '123',
            'switch': 'off'
        },
        output: 'outcome',
        expectedResult: null
    },{
        name:'simple inequality test - compare switch',
        registry: {
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
        },
        functions: {},
        inputs: {
            'A': '123',
            'switch': 'off'
        },
        output: 'switch==on',
        expectedResult: null
    },{
        name:'multiple inputs test',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A',
                    'B'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'A': '123',
            'B': '456'
        },
        output: 'outcome',
        expectedResult: '123-456'
    },{
        name:'multiple inputs test with missing first input',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A',
                    'B'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'C': '123',
            'B': '456'
        },
        output: 'outcome',
        expectedResult: null
    },{
        name:'multiple inputs test with missing second input',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A',
                    'B'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'A': '123',
            'C': '456'
        },
        output: 'outcome',
        expectedResult: null
    },{
        name:'multiple inputs test with optional first input',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'A': '123',
            'B': '456'
        },
        output: 'outcome',
        expectedResult: '123-456'
    },{
        name:'multiple inputs test with optional second input',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A',
                    'B?'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'A': '123',
            'B': '456'
        },
        output: 'outcome',
        expectedResult: '123-456'
    },{
        name:'multiple inputs test with optional & missing first input',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'C': '123',
            'B': '456'
        },
        output: 'outcome',
        expectedResult: 'false-456'
    },{
        name:'multiple inputs test with optional & missing second input',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A',
                    'B?'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'A': '123',
            'C': '456'
        },
        output: 'outcome',
        expectedResult: '123-false'
    },{
        name:'multiple inputs test with optional inputs',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B?'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'A': '123',
            'B': '456'
        },
        output: 'outcome',
        expectedResult: '123-456'
    },{
        name:'multiple inputs test with optional & missing inputs',
        registry: {
            'outcome': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B?'
                ],
                'output': 'outcome'
            }
        },
        functions: {
            'outcome': (A, B) => A + '-' + B
        },
        inputs: {
            'C': '123',
            'D': '456'
        },
        output: 'outcome',
        expectedResult: 'false-false'
    },{
        name:'multiple path on iteration',
        registry: {
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
        },
        functions: {
            'value__to__valueA': (value) => value / 5,
            'value__to__valueB': (value) => value / 2
        },
        inputs: {
            'mode': 'B',
            'value': 10
        },
        output: 'outcome',
        expectedResult: 5
    },{
        name:'optional paths resolving into aggregated type',
        registry: {
            'totalAB': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B?'
                ],
                'output': 'totalAB'
            },
            'totalAB__to__equivalentTotalAB': {
                'type': 'function',
                'input': 'totalAB',
                'output': 'equivalentTotalAB'
            }
        },
        functions: {
            'totalAB': (A, B) => (A || false) + '-' + (B || false),
        },
        inputs: {
            'A': 5
        },
        output: 'totalAB',
        expectedResult: '5-false'
    },{
        name:'optional paths resolving into aggregated type and matched to non-optional path',
        registry: {
            'totalAB': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B?'
                ],
                'output': 'totalAB'
            },
            'totalAB__to__equivalentTotalAB': {
                'type': 'function',
                'input': 'totalAB',
                'output': 'equivalentTotalAB'
            }
        },
        functions: {
            'totalAB': (A, B) => (A || false) + '-' + (B || false),
        },
        inputs: {
            'A': 5
        },
        output: 'equivalentTotalAB',
        expectedResult: '5-false'
    },{
        name:'multiple optional paths resolving into optional aggregated type and matched to non-optional path',
        registry: {
            'totalAB': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B?'
                ],
                'output': 'totalAB'
            },
            'totalCD': {
                'type': 'function',
                'inputs': [
                    'C?',
                    'D?'
                ],
                'output': 'totalCD'
            },
            'totalABCD': {
                'type': 'function',
                'inputs': [
                    'totalAB?',
                    'totalCD?'
                ],
                'output': 'totalABCD'
            },
            'totalABCD__to__equivalenttotalABCD': {
                'type': 'function',
                'input': 'totalABCD',
                'output': 'equivalenttotalABCD'
            }
        },
        functions: {
            'totalAB': (A, B) => (A || false) + '-' + (B || false),
            'totalCD': (C, D) => '[' + (C || false) + '-' + (D || false) + ']',
            'totalABCD': (AB, CD) => '<' + (AB || false) + '-' + (CD || false) + '>'
        },
        inputs: {
            'A': 5,
            'C': 3
        },
        output: 'equivalenttotalABCD',
        expectedResult: '<5-false-[3-false]>'
    },{
        name:'multiple optional paths resolving into non-optional aggregated type and matched to non-optional path',
        registry: {
            'totalAB': {
                'type': 'function',
                'inputs': [
                    'A?',
                    'B?'
                ],
                'output': 'totalAB'
            },
            'totalCD': {
                'type': 'function',
                'inputs': [
                    'C?',
                    'D?'
                ],
                'output': 'totalCD'
            },
            'totalABCD': {
                'type': 'function',
                'inputs': [
                    'totalAB',
                    'totalCD'
                ],
                'output': 'totalABCD'
            },
            'totalABCD__to__equivalenttotalABCD': {
                'type': 'function',
                'input': 'totalABCD',
                'output': 'equivalenttotalABCD'
            }
        },
        functions: {
            'totalAB': (A, B) => (A || false) + '-' + (B || false),
            'totalCD': (C, D) => '[' + (C || false) + '-' + (D || false) + ']',
            'totalABCD': (AB, CD) => '<' + (AB || false) + '-' + (CD || false) + '>'
        },
        inputs: {
            'A': 5,
            'C': 3
        },
        output: 'equivalenttotalABCD',
        expectedResult: '<5-false-[3-false]>'
    },{
        name:'multiple non-optional paths resolving into non-optional aggregated type and matched to non-optional path',
        registry: {
            'totalAB': {
                'type': 'function',
                'inputs': [
                    'A',
                    'B'
                ],
                'output': 'totalAB'
            },
            'totalCD': {
                'type': 'function',
                'inputs': [
                    'C',
                    'D'
                ],
                'output': 'totalCD'
            },
            'totalABCD': {
                'type': 'function',
                'inputs': [
                    'totalAB',
                    'totalCD'
                ],
                'output': 'totalABCD'
            },
            'totalABCD__to__equivalenttotalABCD': {
                'type': 'function',
                'input': 'totalABCD',
                'output': 'equivalenttotalABCD'
            }
        },
        functions: {
            'totalAB': (A, B) => (A || false) + '-' + (B || false),
            'totalCD': (C, D) => '[' + (C || false) + '-' + (D || false) + ']',
            'totalABCD': (AB, CD) => '<' + (AB || false) + '-' + (CD || false) + '>'
        },
        inputs: {
            'A': 5,
            'C': 3
        },
        output: 'equivalenttotalABCD',
        expectedResult: null
    }
]);


// ******************************

function runTests(in_tests){
    let tests = in_tests;

    let focusedTests = in_tests.filter(test => test.focus);
    if (focusedTests && focusedTests.length) {
        tests = focusedTests;
    }

    utils.runGenerator(function *runTestSync(){
        let testIdx = 0;
        while (testIdx < tests.length) {
            let test = tests[testIdx];
            yield _runTest(test);
            testIdx++;
        }
    });
}

// ******************************

function _runTest(in_test) {
    return new Promise((resolve) => {
        servicePath.clearServiceStats();
        servicePath.clearServicePathsUsed();
        servicePath.clearAllDisabledServices();
        servicePath.setup({
            log_level: servicePath.k_LOG_LEVEL_NONE,
            service_registry: in_test.registry,
            service_functions: in_test.functions,
        });

        servicePath.getAndExecuteServicePath(in_test.inputs, in_test.output, 1).then(output => {
            if (output === in_test.expectedResult) {
                cprint.green(`✔ ${in_test.name}`);
                resolve(true);
            } else {
                cprint.red(`✘ ${in_test.name} - Unexpected result: ${output}`);
                resolve(false);
            }
        });
    });
}

// ******************************