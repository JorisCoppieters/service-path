'use strict'; // JS: ES5

// ******************************
//
//
// TIMER
//
//
// ******************************

// ******************************
// Globals:
// ******************************

let g_TIMERS = {};

// ******************************
// Functions:
// ******************************

function startTimer (in_timerKey) {
  g_TIMERS[in_timerKey] = new Date();
}

// ******************************

function stopTimer (in_timerKey) {
  let startDate = g_TIMERS[in_timerKey];
  return (new Date() - startDate) / 1000;
}

// ******************************

function clearTimer (in_timerKey) {
  delete g_TIMERS[in_timerKey];
}

// ******************************
// Exports:
// ******************************

module.exports['start'] = startTimer;
module.exports['stop'] = stopTimer;
module.exports['clear'] = clearTimer;

// ******************************