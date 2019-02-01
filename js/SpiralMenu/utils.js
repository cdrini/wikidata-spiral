/**
 * Calls fn only once, and ignore all future calls within ``wait`` ms of a
 * previous call.
 *
 * @param {Function} fn - the function to call
 * @param {Number} wait - in ms, the length of time necessary after a call
 *                        to trigger another call.
 */
function ignoreSpam(fn, wait) {
  var lastCall = 0;
  return function() {
    var t = (new Date()).getTime();
    if(t - lastCall > wait) {
      fn.apply(this, arguments);
    }
    lastCall = t;
  };
}

/**
 * Calls fn on every count-th call of fn, so long as each call is within lag
 * ms of the last.
 *
 * @example el.click(fixedCall(fn, 1, 300)); // fn is called only if a click
 *                                           // is followed by no other clicks
 *                                           // in the following 300ms
 * @param {Function} fn - the function to call
 * @param {Number} count - the number of times the function must be called
 *                         in order to actually take effect
 * @param {Number} lag - in ms, the length of time we wait for another call
 * @return {Function} a function which only calls fn if called count times,
 *                    with max lag ms between each call.
 */
function fixedCall(fn, count, lag) {
  var callCount = 0;
  var interval = 0;
  return function() {
    var context = this;
    var args = arguments;
    callCount++;

    clearInterval(interval);
    interval = setTimeout(function() {
      if(callCount == count) {
        fn.apply(context, args);
      }
      callCount = 0;
    }, lag);
  }
};

function quickPath() {
  var result = "";
  for (var i = 0; i < arguments.length; i++) {
    result += i > 0 ? " " + arguments[i] : arguments[i];
  };
  return result;
}

function setParam(principal, secondary, key, defaultValue) {
  if(typeof(secondary[key]) == 'undefined') {
    principal[key] = defaultValue;
  } else {
    principal[key] = secondary[key];
  }
}

function assertType(obj, class_name) {
  if(!(obj instanceof class_name)) {
    throw("TYPE ERROR in " + this);
  }
}

/**
 * Returns a random color in hsl format. Avoids similar consecutive random
 * colors.
 *
 * @return {String} a color in hsl format
 */
function randColor() {
  var hue = Math.round(Math.random()*360);
  // avoid returning similar hues right next to each other
  while(Math.abs(randColor.lastHue - hue) < 20) {
    hue = Math.round(Math.random()*360);
  }
  randColor.lastHue = hue;

  var sat = "66%";
  var lightness = "58%";
  return 'hsl(' + hue + ',' + sat + ',' + lightness + ')';
}
randColor.lastHue = 0;

function circlePath(cx, cy, r) {
  // TODO: add nodes param
  // TODO: add param to specify break in circle
  return quickPath('M', cx, cy+r,
    'A', r, r, 0, 0, 1, cx-r, cy,
         r, r, 0, 0, 1, cx, cy-r,
         r, r, 0, 0, 1, cx+r, cy,
         r, r, 0, 0, 1, cx, cy+r, 'Z');
}