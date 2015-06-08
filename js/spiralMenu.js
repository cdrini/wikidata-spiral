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
 * 	                                         // is followed by no other clicks
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

function SpiralMenuItem(setup) {
	setParam(this, setup, 'backgroundImage' , ""           );
	setParam(this, setup, 'icon'            , ""           );
	setParam(this, setup, 'textIcon'        , ""           );
	setParam(this, setup, 'title'           , ""           );
	setParam(this, setup, 'description'     , ""           );
	setParam(this, setup, 'href'            , ""           );
	setParam(this, setup, 'onClick'         , function(){} ); // called BEFORE checking for children and promoting to root
	setParam(this, setup, 'onBecomingRoot'  , function(){} );
	setParam(this, setup, 'children'        , []           );

	this._id = SpiralMenuItem.newId();

	this.click = function() {
		this.onClick(this);
	}
}
SpiralMenuItem.count = 0;
SpiralMenuItem.newId = function() {
	return SpiralMenuItem.count++;
}
SpiralMenuItem.prototype.getId = function() {
	return this._id;
}


SpiralMenuItem.prototype.setBackgroundImage = function(url) {
	this.backgroundImage = url;
	if(this.view) {
		this.view.update();
	}
}

/**
 * Adds the provided smi to the end of this' children
 *
 * @param {SpiralMenuItem} smi - the item to add
 * @return {SpiralMenuItem} this
 */
SpiralMenuItem.prototype.addChild = function(smi) {
	assertType(smi, SpiralMenuItem);
	this.children.push(smi);

	this.emit('child added', [smi]);
	return this;
};

SpiralMenuItem.prototype.isLeaf = function() {
	return this.children.length === 0;
};

/**
 * Finds the smi in the children, if present.
 *
 * @param {SpiralMenuItem} smi - the item to find
 * @return {Number} the smi's index, or -1 if not found
 */
SpiralMenuItem.prototype.indexOf = function(smi) {
	var id = smi.getId();
	for(var i = 0; i < this.children.length; ++i) {
		if(this.children[i].getId() == id) {
			return i;
		}
	}

	// couldn't find the element
	return -1;
};

/**
 * Finds and removes the provided child node
 *
 * @param {SpiralMenuItem} smi - the item to remove
 * @return {SpiralMenuItem} the item removed
 */
SpiralMenuItem.prototype.removeChild = function(smi) {
	var index = this.indexOf(smi);
	if(index !== -1) {
		this.children.splice(index, index);
		this.emit('child removed', [smi]);
		return smi;
	} else {
		// couldn't find the element
		throw("Cannot remove SMI; it is not a direct child.");
	}
};

/**
 * Notifies the view of a change.
 * FIXME: This seems like an ugly solution...
 *
 * @param {String} eventName
 * @param {Array} args - supplementary args to be passedr
 */
SpiralMenuItem.prototype.emit = function(eventName, args) {
	if(this.view) this.view.notify(eventName, args);
}

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

	this.startIndex = 0; // the index of this.currentRoot.children which we are showing
}

/**
 * Creates the spiral menu
 * 
 * @return {Element} the svg element
 */
SpiralMenu.prototype.draw = function() {
	// Update sliceCount
	this.sliceCount = Math.min(this.maxSlices, this.currentRoot.children.length);
	
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
		new SpiralMenuItemView(this, this.currentRoot.children[i], i);
	}

	// draw root
	new SpiralMenuItemView(this, this.currentRoot);

	// draw title
	this.drawTitle();

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
	this.startIndex = 0; // FIXME
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
	this.svg.title = s.text(50, 50, root.title).addClass('title')
	.attr({
		textpath: path,
		pointerEvents: 'none',
		dy: -2
	});

	this.svg.title.textPath.attr({
		startOffset: '48%'
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
 * @param {String} dir - one of left, right
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
	this.currentRoot = newRoot;
	this.sliceCount = Math.min(this.maxSlices, newRoot.children.length);

	// animate slice to root
	var newRootSlice = this.slices[newRootIndex];
	newRootSlice.shape.animate({
		d: sm.innerCirclePath()
	}, this.animationLength, mina.linear, function() {
		newRootSlice.destroy();

		// redraw
		sm.startIndex = 0;
		sm.draw();
	});
	newRootSlice.update();
}

SpiralMenu.prototype.demoteRoot = function() {
	// remove root
	this.currentRoot.view.destroy();

	// remove all children
	for(var i = 0; i < this.sliceCount; ++i) {
		this.slices[i].destroy();
	}

	// update root
	this.currentRoot = this.currentRoot.parent;

	this.startIndex = 0;
	this.draw();
};

/**
 * Scrolls next child item into view
 * 
 * @return {Element} the new slice's group (if a new one was created)
 */
SpiralMenu.prototype.next = function() {
	var sm = this;
	var newI = this.startIndex + this.sliceCount;

	// if no next item, exit
	if (newI >= this.currentRoot.children.length) {
		return;
	}

	// get first slice and shrink/remove it
	var slice = this.slices[0];
	slice.shape.animate({
		d: sm.createEmptySlicePath(0, 'start')
	}, this.animationLength, function() {
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
	this.startIndex++;

	return newSlice.group;
}

/**
 * Scrolls to previous child item into view
 * 
 * @return {Element} the new slice's group (if a new one was created)
 */
SpiralMenu.prototype.previous = function() {
	var sm = this;
	var newI = this.startIndex - 1;

	// if no previous item, exit
	if (newI < 0) {
		return;
	}

	// get last slice and shrink/remove it
	var slice = this.slices[this.sliceCount - 1];
	slice.shape.animate({
		d: sm.createEmptySlicePath(this.sliceCount - 1, 'end')
	}, this.animationLength, function() {
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
	this.startIndex--;

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
}

/**
 * Stores relevant data for the view of SpiralMenuItem
 * 
 * @constructor
 * @param {SpiralMenu}     sm:    the spiral menu
 * @param {SpiralMenuItem} smi:   the item represented
 * @param {Number}         index: the item's index (if a slice). If undefined,
 *                                it is a root
 */
function SpiralMenuItemView(sm, smi, index) {
	this.sm = sm;
	this.smi = smi;
	this.index = index;

	smi.view = this;

	if (typeof(index) == 'undefined' || index < 0) {
		this.drawRoot();
	} else {
		this.drawSlice();
	}
};

/**
 * Destroys a slice
 */
SpiralMenuItemView.prototype.destroy = function() {
	if (this.shape.parent().type == 'clipPath') {
		this.shape.parent().remove();
	} else {
		this.shape.remove();
	}

	this.group.remove();

	delete this.smi.view;
	delete this.smi;
	delete this.group;
	delete this.shape;
};

/**
 * Creates the slice
 * @private
 */
SpiralMenuItemView.prototype.drawSlice = function() {
	var sm = this.sm;
	var smi = this.smi;
	var index = this.index;
	var slices = sm.sliceCount;
	var s = sm.svg;

	// create group
	var group = s.group();
	group.attr({
		class: 'slice' + (smi.isLeaf()? ' leaf' : ''),
		title: smi.title
	});
	smi.view = this;

	// create path
	var pathStr = sm.createSlicePath(index);
	var shape = s.path(pathStr);
	shape.attr({
		style: "fill:" + randColor()
	});
	group.add(shape);

	// bounding box (for use later)
	var bbox = shape.getBBox();

	// create background image
	if (smi.backgroundImage) {
		var img = s.image(smi.backgroundImage, bbox.x, bbox.y, bbox.w, bbox.h);
		img.attr({
			preserveAspectRatio: 'xMidYMid slice',
			clip: shape
		});
		group.add(img);
	} else {
		shape.addClass('main-shape');
	}

	if(smi.textIcon || !smi.backgroundImage) {
		smi.textIconText = smi.textIcon || smi.title[0];
		// find center of slice
		var centerAngle = 2*Math.PI*(this.index/sm.sliceCount + 0.5/sm.sliceCount);
		var centerRadius = (sm.outerRadius + sm.innerRadius)/2
		var cx = centerRadius*Math.cos(centerAngle);
		var cy = centerRadius*Math.sin(centerAngle);

		var text = s.text(sm.center.x + cx, sm.center.y + cy, [smi.textIconText]);
		text.select('tspan').attr({
			textAnchor: 'middle',
			alignmentBaseline: 'middle'
		});
		text.addClass('text-icon');
		group.add(text);
	}

	// dbl click handlers
	group.dblclick(function() {
		open(smi.href);
	});

	// attach click handlers
	// fixedCall avoids interferring with dblclick
	group.click(fixedCall(function() {
		smi.click();
		sm.clickHandler(true, smi);

		if (!smi.isLeaf()) {
			sm.promoteChild(smi);
		}
	}, 1, 300));

	// attach hover handlers
	group.hover(function() {
		sm.updateTitle(smi.title);
		sm.stopAutoScroll();
	}, function() {
		sm.updateTitle(sm.currentRoot.title);
		if(sm.autoScroll) {
			sm.startAutoScroll();
		}
	});

	sm.slices[index] = this;
	sm.svg.spiral.add(group);
	this.group = group;
	this.shape = shape;
};

/**
 * Creates a spiral menu's root element.
 * @private
 */
SpiralMenuItemView.prototype.drawRoot = function() {
	var sm = this.sm;
	var smi = this.smi;
	var s = sm.svg;
	
	// create group
	var group = s.group();
	group.attr({
		class: 'root',
		title: smi.title,
	});
	group.node.style.transformOrigin = sm.center.x + 'px ' + sm.center.y + 'px';

	// create SVG circle
	var shape = sm.drawInnerCircle(false);
	shape.attr({
		style: "fill: " + randColor()
	});
	group.add(shape);

	// create background image
	if (smi.backgroundImage) {
		// create circle for clipping
		var topLeft = {
			x: sm.center.x - sm.innerRadius,
			y: sm.center.y - sm.innerRadius
		};
		var img = s.image(smi.backgroundImage, topLeft.x, topLeft.y, sm.innerRadius*2, sm.innerRadius*2);
		img.attr({
			preserveAspectRatio: 'xMidYMid slice',
			clip: shape
		});
		group.add(img);

		if (sm.animate) {
			//circle.animate({r: sm.innerRadius}, 1000);
			Snap.animate(0, 1, function(factor){
				img.attr({
					width: factor*sm.innerRadius*2,
					height: factor*sm.innerRadius*2
				});
			}, sm.animationLength);
		}
	} else {
		shape.addClass('main-shape');
	}

	if (sm.animate) {
		//shape.animate({r: sm.innerRadius}, 1000);
		Snap.animate(0, 1, function(factor){
			shape.attr({
				r: factor*sm.innerRadius
			});
		}, sm.animationLength);
	}
	// create circle for text wrap
	// create text

	// dbl click handlers
	group.dblclick(function() {
		open(smi.href);
	});

	// click handlers
	group.click(fixedCall(function() {
		sm.currentRoot.click();
		sm.clickHandler(false, sm.currentRoot);

		if (sm.currentRoot.parent) {
			sm.demoteRoot();
		}
	}, 1, 300));

	sm.svg.spiral.add(group);
	this.shape = shape;
	this.group = group;
};

/**
 * Updates the image, shape, etc. of a slice
 */
SpiralMenuItemView.prototype.update = function() {
	var s = this.sm.svg;
	var smi = this.smi;

	// Update backgroundImage
	if(smi.backgroundImage) {
		// If we already had an image
		var img = this.group.select('image');
		if(img) {
			var clipPathId = img.attr('clip-path').match(/#[^\)]*/);
			if(!clipPathId) {
				console.log(img);
				console.log(img.attr('clip-path'));
			}
			clipPathId = clipPathId[0];
			var clipPath = Snap(clipPathId + ' > path');
			var bbox = clipPath.getBBox();

			
			var anim = clipPath.inAnim();

			if (anim.length) {
				anim = anim[anim.length-1];

				// create temporary at end of anim, to get bbox
				var clone = clipPath.clone();
				clone.attr(anim.anim.attr);
				bbox = clone.getBBox();
				clone.remove();
				img.attr({
					'xlink:href': smi.backgroundImage
				});				
				img.animate({
					x: Math.round(bbox.x),
					y: Math.round(bbox.y),
					width: Math.round(bbox.w),
					height: Math.round(bbox.h)
				}, sm.animationLength);
				img.inAnim()[0].status(anim.status());
			}
			
			img.attr({
				'xlink:href': smi.backgroundImage,
				x: Math.round(bbox.x),
				y: Math.round(bbox.y),
				width: Math.round(bbox.w),
				height: Math.round(bbox.h)
			});
		}

		// If we must now add an image
		else {
			var clipShape = this.group.select('.main-shape');
			var bbox = clipShape.getBBox();

			var img = s.image(smi.backgroundImage,
				Math.round(bbox.x),
				Math.round(bbox.y),
				Math.round(bbox.w),
				Math.round(bbox.h));
			img.attr({
				preserveAspectRatio: 'xMidYMid slice',
				clip: clipShape
			});
			this.group.add(img);
		}
	}

	// remove textIcon if using default icon
	if (smi.backgroundImage && smi.textIconText && !smi.textIcon) {
		this.group.select('.text-icon').remove();
		delete smi.textIconText;
	}

	// Update textIcon location
	if(smi.textIcon || !smi.backgroundImage) {
		// find center of slice
		var centerAngle = 2*Math.PI*(this.index/sm.sliceCount + 0.5/sm.sliceCount);
		var centerRadius = (sm.outerRadius + sm.innerRadius)/2
		var cx = centerRadius*Math.cos(centerAngle);
		var cy = centerRadius*Math.sin(centerAngle);

		var text = this.group.select('.text-icon').animate({
			x: sm.center.x + cx,
			y: sm.center.y + cy
		}, sm.animationLength);

		// ensure ontop of backgroundImage
		if(smi.backgroundImage) {
			text.insertAfter(this.group.select('image'));
		}
	}
};

SpiralMenuItemView.prototype.notify = function(notification, args) {
	var smi = this.smi;
	var sm = this.sm;

	switch(notification) {
		case 'child added':
			// if added child should not be in the view, do nothing
			// it will only have to be in the view if we do not have enough items
			if ( sm.sliceCount < sm.maxSlices ) {
				sm.redraw();
			}
		break;
		case 'child removed':
		// only have to do stuff if child is in view
		if (args[0].view) {
			// if last slice, must decrement startIndex
			if (args[0].view.index == sm.sliceCount) {
				// FIXME should decrement
			} 
			
			sm.redraw();
		}
		break;
	}
};
