/**
 * @private
 * @param {any} maybeBool 
 * @return {boolean}
 */
function _isBoolean(maybeBool) {
  return maybeBool === true || maybeBool === false;
}

/**
 * @param {object} defaultOpts default for all URL parameters; used for determining
 * parameter types
 * @param {object} aliases aliases for url parameters (map of alias->param name)
 * @return {object} user-defined URL parameters
 */
function parseURLParams(defaultOpts, aliases) {
  var params = location.search;
  if(!params) return {};

  params = params.slice(1).split('&')
  .map(function(p) {
    var pair = p.split('=');
    return {
      param: pair[0],
      value: pair[1]
    };
  });

  var result = {};
  for(var i = 0; i < params.length; ++i) {
    var paramName = params[i].param;
    if (paramName in aliases) paramName = aliases[paramName];

    if(defaultOpts[paramName] instanceof Array) {
      result[paramName] = params[i].value.split(',');
    }
    else if (_isBoolean(defaultOpts[paramName])) {
      result[paramName] = params[i].value === 'true' ? true : false;
    }
    else if (typeof defaultOpts[paramName] == 'number') {
      result[paramName] = +params[i].value; // convert to number - float or int
    }
    else {
      result[paramName] = params[i].value;
    }
  }

  return result;
}

/**
 * Combines the default options with the user-defined options to create a full
 * options object (ie all keys have values)
 * @param {object} defaultOpts 
 * @param {object} userOpts user-defined parameters
 * @return {object} full options object
 */
function buildFullOpts(defaultOpts, userOpts) {
  var result = {};
  for (var key in defaultOpts) {
    result[key] = key in userOpts ? userOpts[key] : defaultOpts[key];
  }
  return result;
}