/**
 * A SpiralMenu
 *
 * @constructor
 * @param {object} setup - settings
 */
function SpiralMenu(setup) {
  var sampleClickFn = function(isChild, smi){};
  setParam(this, setup, 'root'               , null          );
  setParam(this, setup, 'size'               , 400           ); // in px
  setParam(this, setup, 'onClick'            , sampleClickFn );
  setParam(this, setup, 'animate'            , true          );
  setParam(this, setup, 'animationLength'    , 500           ); // in ms
  setParam(this, setup, 'maxSlices'          , 12            ); // slices to display at a time
  setParam(this, setup, 'autoScroll'         , false         );
  setParam(this, setup, 'autoScrollLength'   , 2500          ); // in ms
  setParam(this, setup, 'pageStart'          , 0             ); // index of currentRoot.children we're starting from
  setParam(this, setup, 'alwaysShowTextIcon' , false         ); // whether text icon overlays images

  this.sourceRoot = this.root;         // The 'true' root
  this.currentRoot = this.sourceRoot;  // The root as a result of navigation. Could change.

  this.clickHandler = this.onClick;

  this.titleSize = 60; //px

  this.canvasWidth = this.size + 2*this.titleSize; //left/right
  this.canvasHeight = this.size + this.titleSize;

  this.outerRadius = (this.size - 20)/2; // how much the circle will expand on hover(?)
  this.innerRadius = this.outerRadius*0.5;

  this.center = {
    x: this.size/2 + this.titleSize,
    y: this.size/2 + this.titleSize
  };

  this.sliceCount = Math.min(this.maxSlices, this.currentRoot.children.length);

  this.validatePageStart();

  // event listeners
  this.listeners = {
    'scroll': []
  };
}

/**
 * Ensures the page start is in a valid range
 */
SpiralMenu.prototype.validatePageStart = function() {
  if (this.maxSlices < this.sliceCount && this.pageStart > 0 ||
    this.pageStart > this.currentRoot.children.length - this.sliceCount)
  {
    this.pageStart = Math.max(0, this.currentRoot.children.length - this.sliceCount);
  }
}

/**
 * Creates the spiral menu
 *
 * @return {Element} the svg element
 */
SpiralMenu.prototype.draw = function() {
  // Update sliceCount
  this.sliceCount = Math.min(this.maxSlices, this.currentRoot.children.length);
  this.validatePageStart();

  // create svg
  if (!this.svg) {
    this.svg = Snap(this.canvasWidth, this.canvasHeight).addClass('spiral-menu');
    /* this does make it look better on mobile, but makes it impossible to zoom :/
    this.svg.attr({
      viewBox: '0 0 ' + this.canvasWidth + ' ' + this.canvasHeight,
      width: '100%',
      height: '100%'
    });*/

    this.svg.spiral = this.svg.group().addClass('spiral');
  }

  // draw slices
  this.slices = [];
  for(var i = 0; i < this.sliceCount; ++i) {
    new SpiralMenuItemView(this, this.currentRoot.children[this.pageStart + i], i);
  }

  // draw root
  new SpiralMenuItemView(this, this.currentRoot);

  // draw title
  this.drawTitle();

  // trigger event
  this.trigger('scroll');

  // begin autoscrolling
  if(this.autoScroll) {
    this.startAutoScroll();
  }
  return this.svg;
};

/**
 * Redraws the spiral.
 * @private
 */
SpiralMenu.prototype.redraw = function() {
  // remove root
  this.currentRoot.view.destroy();

  // remove all children
  for(var i = 0; i < this.sliceCount; ++i) {
    this.slices[i].destroy();
  }

  // draw
  this.draw();
};

/**
 * Creates circle at the size of the outer circle
 *
 * @return {Element} the circle's element
 */
SpiralMenu.prototype.drawOuterCircle = function(asPath) {
  if(!asPath) {
    return this.svg.circle(this.center.x, this.center.y, this.outerRadius);
  } else {
    return this.svg.path(circlePath(this.center.x, this.center.y, this.outerRadius));
  }
}

/**
 * Creates circle at the size of the inner circle
 *
 * @return {Element} the circle's element
 */
SpiralMenu.prototype.drawInnerCircle = function(asPath) {
  if(!asPath) {
    return this.svg.circle(this.center.x, this.center.y, this.innerRadius);
  } else {
    return this.svg.path(circlePath(this.center.x, this.center.y, this.innerRadius));
  }
}

/**
 * Creates path string of circle at the size of the outer circle
 *
 * @return {String} the circle's path string
 */
SpiralMenu.prototype.outerCirclePath = function() {
  return circlePath(this.center.x, this.center.y, this.outerRadius);
}

/**
 * Creates path string of circle at the size of the inner circle
 *
 * @return {String} the circle's path string
 */
SpiralMenu.prototype.innerCirclePath = function() {
  return circlePath(this.center.x, this.center.y, this.innerRadius);
}

/**
 * Creates the necessary structure for the title
 *
 * @return {Element} the title's element
 */
SpiralMenu.prototype.drawTitle = function() {
  var sm = this;
  var s = this.svg;
  var root = this.currentRoot;

  // Title already created
  if(this.svg.title) {
    sm.resetTitle();
    return this.svg.title;
  }

  var circle = this.drawOuterCircle(true);
  var path = circle.attr('d');
  circle.remove();

  // create text on path
  this.svg.title = s.text(0, 0, root.title).addClass('title')
  .attr({
    x: '',
    y: '',
    textpath: path,
    pointerEvents: 'none',
    dy: -2
  });

  this.svg.title.textPath.attr({
    startOffset: '50%'
  });

  return this.svg.title;
};

/**
 * Update title content
 *
 * @param {string} text - the new title.
 * @return {Element} the title's element
 */
SpiralMenu.prototype.updateTitle = function(text) {
  return this.svg.title.textPath.node.innerHTML = text;
}
/**
 * Sets title content to currentRoot's title
 *
 * @return {Element} the title's element
 */
SpiralMenu.prototype.resetTitle = function() {
  return this.svg.title.textPath.node.innerHTML = this.currentRoot.title;
}

/**
 * Creates a spiral menu's slice path 'd' string
 *
 * @param {Number} index - the index on the circle
 * @return {String} the slice's path string
 */
SpiralMenu.prototype.createSlicePath = function(index) {
  var slices = this.sliceCount;
  var PI = Math.PI;

  if(slices == 1) {
    return this.outerCirclePath();
  }

  var sliceAngle = 2*PI / slices;
  var startDegree = index*sliceAngle;
  var endDegree = startDegree + sliceAngle;
  var innerStartCoord = {
    x: this.center.x + this.innerRadius * Math.cos(startDegree), // TODO optimize
    y: this.center.y + this.innerRadius * Math.sin(startDegree)
  };
  var innerEndCoord = {
    x: this.center.x + this.innerRadius * Math.cos(endDegree),
    y: this.center.y + this.innerRadius * Math.sin(endDegree)
  };
  var outerStartCoord = {
    x: this.center.x + this.outerRadius * Math.cos(startDegree),
    y: this.center.y + this.outerRadius * Math.sin(startDegree)
  };
  var outerEndCoord = {
    x: this.center.x + this.outerRadius * Math.cos(endDegree),
    y: this.center.y + this.outerRadius * Math.sin(endDegree)
  };

  // create SVG slice
  var pathStr = quickPath('M', outerStartCoord.x, outerStartCoord.y,
    'A', this.outerRadius, this.outerRadius, 0, 0, 1, outerEndCoord.x, outerEndCoord.y,
    'L', innerEndCoord.x, innerEndCoord.y,
    'A', this.innerRadius, this.innerRadius, 0, 0, 0, innerStartCoord.x, innerStartCoord.y,
    'Z');

  return pathStr;
}

/**
 * Creates a spiral menu's slice path 'd' string, used when removing the slice.
 *
 * @param {Number} index - the index on the circle
 * @param {String} dir - one of start, end
 * @return {String} the slice's path string
 */
SpiralMenu.prototype.createEmptySlicePath = function(index, dir) {
  var slices = this.sliceCount;
  var PI = Math.PI;

  var sliceAngle = 2*PI / slices;
  var startDegree = index*sliceAngle;
  var endDegree = startDegree + sliceAngle;
  var innerStartCoord = {
    x: this.center.x + this.innerRadius * Math.cos(startDegree), // TODO optimize
    y: this.center.y + this.innerRadius * Math.sin(startDegree)
  };
  var innerEndCoord = {
    x: this.center.x + this.innerRadius * Math.cos(endDegree),
    y: this.center.y + this.innerRadius * Math.sin(endDegree)
  };
  var outerStartCoord = {
    x: this.center.x + this.outerRadius * Math.cos(startDegree),
    y: this.center.y + this.outerRadius * Math.sin(startDegree)
  };
  var outerEndCoord = {
    x: this.center.x + this.outerRadius * Math.cos(endDegree),
    y: this.center.y + this.outerRadius * Math.sin(endDegree)
  };

  // create SVG slice
  var pathStr = "";

  switch(dir) {
    case 'start':
      pathStr = quickPath('M', outerStartCoord.x, outerStartCoord.y,
        'A', this.outerRadius, this.outerRadius, 0, 0, 1, outerStartCoord.x+0.1, outerStartCoord.y+0.1,
        'L', innerStartCoord.x, innerStartCoord.y,
        'A', this.innerRadius, this.innerRadius, 0, 0, 0, innerStartCoord.x-0.1, innerStartCoord.y-0.1,
        'Z');
      break;
    case 'end':
      pathStr = quickPath('M', outerEndCoord.x, outerEndCoord.y,
        'A', this.outerRadius, this.outerRadius, 0, 0, 1, outerEndCoord.x+0.1, outerEndCoord.y+0.1,
        'L', innerEndCoord.x, innerEndCoord.y,
        'A', this.innerRadius, this.innerRadius, 0, 0, 0, innerEndCoord.x-0.1, innerEndCoord.y-0.1,
        'Z');
      break;
  }

  return pathStr;
}

SpiralMenu.prototype.promoteChild = function(newRoot) {
  var sm = this;

  // remove root
  this.currentRoot.view.destroy();

  // remove all visible slices
  var newRootId = newRoot.getId();
  var newRootIndex = 0;
  for(var i = 0; i < this.sliceCount; ++i) {
    if(newRootId == this.slices[i].smi.getId()) {
      newRootIndex = i;
      continue; // will animate this slice
    }
    this.slices[i].destroy();
  }

  // update root, creating way to go back
  newRoot.parent = this.currentRoot;
  newRoot.parentPageStart = sm.pageStart;
  newRoot.parentSliceCount = sm.sliceCount;
  this.currentRoot = newRoot;
  this.sliceCount = Math.min(this.maxSlices, newRoot.children.length);

  // animate slice to root
  var newRootSlice = this.slices[newRootIndex];
  newRootSlice.shape.animate({
    d: sm.innerCirclePath()
  }, this.animationLength, mina.linear, function() {
    newRootSlice.destroy();

    // redraw
    sm.pageStart = 0;

    // trigger event
    sm.trigger('scroll');

    sm.draw();
  });
  newRootSlice.update();
}

SpiralMenu.prototype.demoteRoot = function() {
  var sm = this;

  // remove all children
  for(var i = 0; i < this.sliceCount; ++i) {
    this.slices[i].destroy();
  }

  // animate root to slice
  sm.sliceCount = this.currentRoot.parentSliceCount;
  var absIndex = this.currentRoot.parent.indexOf(this.currentRoot);
  var relIndex = absIndex - this.currentRoot.parentPageStart;
  sm.currentRoot.view.shape.animate({
    d: sm.createSlicePath(relIndex)
  }, sm.animationLength, mina.linear, function() {
    // remove root view
    sm.currentRoot.view.destroy();
    // update root
    sm.pageStart = sm.currentRoot.parentPageStart;
    sm.currentRoot = sm.currentRoot.parent;

    // trigger event
    sm.trigger('scroll');

    // redraw
    sm.draw();
  });
  sm.currentRoot.view.update();

};

/**
 * Scrolls next child item into view
 *
 * @return {Element} the new slice's group (if a new one was created)
 */
SpiralMenu.prototype.next = function() {
  var sm = this;
  var newI = this.pageStart + this.sliceCount;

  // if no next item, exit
  if (newI >= this.currentRoot.children.length) {
    return;
  }

  // get first slice and shrink/remove it
  var slice = this.slices[0];
  slice.shape.animate({
    d: sm.createEmptySlicePath(0, 'start')
  }, this.animationLength, mina.linear, function() {
    slice.destroy();
  });
  this.slices.shift(); // remove first element, shifting down

  // create new slice for next item
  var newSlice = new SpiralMenuItemView(sm, this.currentRoot.children[newI], this.sliceCount - 1);
  newSlice.shape.attr({
    d: sm.createEmptySlicePath(this.sliceCount - 1, 'end')
  });
  newSlice.group.attr({
    opacity: 0
  });
  newSlice.shape.animate({
    d: sm.createSlicePath(this.sliceCount - 1)
  }, this.animationLength);
  newSlice.group.animate({
    opacity: 1
  }, this.animationLength);

  // move all the other slices forward 1
  for(var i = 0; i < this.slices.length - 1; ++i) {
    this.slices[i].shape.animate({
      d: sm.createSlicePath(i)
    }, this.animationLength);
    this.slices[i].index = i;
    this.slices[i].update();
  }
  sm.pageStart++;

  // trigger event
  sm.trigger('scroll');

  return newSlice.group;
}

/**
 * Scrolls to previous child item into view
 *
 * @return {Element} the new slice's group (if a new one was created)
 */
SpiralMenu.prototype.previous = function() {
  var sm = this;
  var newI = this.pageStart - 1;

  // if no previous item, exit
  if (newI < 0) {
    return;
  }

  // get last slice and shrink/remove it
  var slice = this.slices[this.sliceCount - 1];
  slice.shape.animate({
    d: sm.createEmptySlicePath(this.sliceCount - 1, 'end')
  }, this.animationLength, mina.linear, function() {
    slice.destroy();
  });
  this.slices.unshift({}); // push {} from left
  this.slices.pop(); // remove last element

  // create new slice for next item
  var newSlice = new SpiralMenuItemView(sm, this.currentRoot.children[newI], 0);
  newSlice.shape.attr({
    d: sm.createEmptySlicePath(0, 'start')
  });
  newSlice.group.attr({
    opacity: 0
  });
  newSlice.shape.animate({
    d: sm.createSlicePath(0)
  }, this.animationLength);
  newSlice.group.animate({
    opacity: 1
  }, this.animationLength);

  // move all the other slices back 1
  for(var i = 1; i < this.slices.length; ++i) {
    this.slices[i].shape.animate({
      d: sm.createSlicePath(i)
    }, this.animationLength);
    this.slices[i].index = i;
    this.slices[i].update();

  }
  sm.pageStart--;

  // trigger event
  sm.trigger('scroll');

  return newSlice.group;
};

/**
 * Begins auto scrolling the UI.
 *
 * @param {Number} ms - length of scroll interval.
 */
SpiralMenu.prototype.startAutoScroll = function(ms) {
  if (sm.autoScrollInterval) return; // don't start if already started

  var sm = this;
  this.autoScrollInterval = setInterval(function() {
    if(!sm.next()) {
      sm.stopAutoScroll();
    }
  }, ms || this.autoScrollLength);
};

/**
 * Stops auto scrolling the UI.
 *
 */
SpiralMenu.prototype.stopAutoScroll = function() {
  if(!this.autoScrollInterval) return;
  clearInterval(this.autoScrollInterval);
  this.autoScrollInterval = 0;
};

/**
 * Adds an event listener
 *
 * @param {String} eventName - the name of the event (see listeners object in
 *                             constructor)
 * @param {Function} callback - the function to perform when the event occurs
 */
SpiralMenu.prototype.on = function(eventName, callback) {
  if (typeof(this.listeners[eventName]) == 'undefined') {
    throw ("'" + eventName + "' is not a recognized event.");
  }

  this.listeners[eventName].push(callback);
};

/**
 * Removes an event listener. If callback not present, throws an error.
 *
 * @param {String} eventName - the name of the event (see listeners object in
 *                             constructor)
 * @param {Function} callback - the callback to remove
 */
SpiralMenu.prototype.off = function(eventName, callback) {
  if (typeof(this.listeners[eventName]) == 'undefined') {
    throw ("'" + eventName + "' is not a recognized event.");
  }

  var listeners = this.listeners[eventName];
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i] == callback ||
      listeners[i].toString() == callback.toString()){
      this.listeners[eventName].splice(i, 1);
      return;
    }
  };

  // we failed to find it
  throw (callback.toString() + ' is not a listener');

};

/**
 * Triggers an event, calling any listeners listening to the event.
 *
 * @private
 * @param {String} eventName - the name of the event (see listeners object in
 *                             constructor)
 */
SpiralMenu.prototype.trigger = function(eventName, args) {
  if (typeof(this.listeners[eventName]) == 'undefined') {
    throw ("'" + eventName + "' is not a recognized event.");
  }

  var listeners = this.listeners[eventName];
  for (var i = 0; i < listeners.length; i++) {
    listeners[i].apply(this, args);
  };
};

/**
 * Gets first and last indices of the current page
 *
 * return {Object} bounds.first - first index
 *                 bounds.last  - last index
 *                 bounds.count - number of elements in page
 */
SpiralMenu.prototype.getPageBounds = function() {
  var sm = this;
  return {
    first: sm.pageStart,
    last: sm.pageStart + sm.sliceCount - 1,
    count: sm.sliceCount
  };
};