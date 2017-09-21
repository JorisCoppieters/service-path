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

function setRequestData (in_request, in_requestKey, in_requestValue, in_requestValueType) {
  let requestValue = in_requestValue;
  switch (in_requestValueType)
  {
    case 'int':
      requestValue = parseInt(requestValue);
      break;

    case 'float':
    case 'number':
      requestValue = parseFloat(requestValue);
      break;

    case 'bool':
    case 'boolean':
      requestValue = (['true', '1'].indexOf((requestValue + "").toLowerCase()) >= 0);
      break;
  }

  let requestDataObj = in_request;
  let requestDataKeyParts = in_requestKey.split('->');
  requestDataKeyParts.forEach((requestDataKeyPart, idx) => {
    if (idx === requestDataKeyParts.length - 1) {
      requestDataObj[requestDataKeyPart] = requestValue;
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

function isPromise (in_value) {
  return in_value && typeof(in_value) === "object" && typeof(in_value.then) === "function";
}

// ******************************

function keyValToString (in_inputs) {
  let keyVals = Object.keys(in_inputs).map((key) => {
    let val = in_inputs[key] || 'NULL';
    val = toShortString(val);
    return key + '=>' + val;
  });
  return keyVals.join(',');
}

// ******************************

function toShortString (in_input) {
  let val = in_input;
  if (typeof(val) !== 'string') {
    val = JSON.stringify(val);
  }
  if (typeof(val) !== 'string') {
    return '';
  }
  if (val.length > 2000) {
    val = val.substr(0, 2000) + '...';
  }
  return val;
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
module.exports['getResponseKeyBody'] = getResponseKeyBody;
module.exports['getValue'] = getValue;
module.exports['isPromise'] = isPromise;
module.exports['keyValToString'] = keyValToString;
module.exports['toShortString'] = toShortString;
module.exports['runGenerator'] = runGenerator;
module.exports['setRequestData'] = setRequestData;
module.exports['toArray'] = toArray;

// ******************************