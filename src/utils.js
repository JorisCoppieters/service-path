'use strict'; // JS: ES6

// ******************************
//
//
// UTILS
//
//
// ******************************

// ******************************
// Functions:
// ******************************

function setRequestData (in_request, in_requestKey, in_requestValue) {
  let requestDataObj = in_request;
  let requestDataKeyParts = in_requestKey.split('->');
  requestDataKeyParts.forEach((requestDataKeyPart, idx) => {
    if (idx === requestDataKeyParts.length - 1) {
      requestDataObj[requestDataKeyPart] = in_requestValue;
    } else {
      requestDataObj[requestDataKeyPart] = requestDataObj[requestDataKeyPart] || {};
      requestDataObj = requestDataObj[requestDataKeyPart];
    }
  });
}

// ******************************

function getResponseKeyBody (in_response, in_responseKey) {
  let responseDataObj = in_response;
  let responseKeyParts = in_responseKey.split('->');
  responseKeyParts.forEach((responseKeyPart, idx) => {
    if (!responseDataObj || !responseDataObj[responseKeyPart]) {
      responseDataObj = null;
      return;
    }

    responseDataObj = responseDataObj[responseKeyPart];
  });

  return responseDataObj;
}

// ******************************

function arrayContainedIn (in_array1, in_array2) {
  let matched = in_array1.filter((elem) => {
    return in_array2.indexOf(elem) >= 0;
  });

  return matched.length === in_array1.length;
}

// ******************************

function toArray (in_value) {
  return (Array.isArray(in_value) ? in_value : [in_value]);
}

// ******************************

function keyValToString (in_inputs) {
  let val;
  let keyVals = Object.keys(in_inputs).map((key) => {
    val = in_inputs[key];
    if (val.length > 100) {
      val = val.substr(0, 100) + '...';
    }
    return key + '=>' + val;
  });
  return keyVals.join(',');
}

// ******************************

function getProperty (in_object, in_key, in_default) {
  if (!in_object) {
    return null;
  }

  if (in_object[in_key] === undefined) {
    return typeof(in_default) === 'undefined' ? false : in_default;
  }

  return in_object[in_key];
}

// ******************************

function getValue (in_value) {
  if (!in_value) {
    return null;
  }

  if (getProperty(in_value, 'error', false) || getProperty(in_value, 'warning', false)) {
    return null;
  }

  return in_value;
}

// ******************************

function runGenerator (generatorFunction) {
  let next = function (err, arg) {
    if (err) return it.throw(err);

    let result = it.next(arg);
    if (result.done) return;

    if (result.value && result.value.then) {
      result.value
      .then((resolveResult) => {
        next(null, resolveResult);
      })
      .catch((rejectResult) => {
        next(rejectResult, null);
      });
    } else {
      next(null, result.value);
    }
  }

  let it = generatorFunction();
  return next();
}

// ******************************
// Exports:
// ******************************

module.exports['arrayContainedIn'] = arrayContainedIn;
module.exports['getProperty'] = getProperty;
module.exports['getValue'] = getValue;
module.exports['getResponseKeyBody'] = getResponseKeyBody;
module.exports['keyValToString'] = keyValToString;
module.exports['runGenerator'] = runGenerator;
module.exports['setRequestData'] = setRequestData;
module.exports['toArray'] = toArray;

// ******************************