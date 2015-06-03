// Get Snap.svg
if (!Snap) {
	var script = document.createElement('script');
	script.src = "https://cdnjs.cloudflare.com/ajax/libs/snap.svg/0.3.0/snap.svg-min.js";
	document.head.appendChild(script);
}

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
 * @example el.click(fixedCall(fn, 1, 300)); // fn is called only if there
 *                                           // a click occurs >300ms after
 *                                           // the last click
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
function randColor() {
	var hue = Math.round(Math.random()*360);
	var sat = "66%";
	var lightness = "58%";
	return 'hsl(' + hue + ',' + sat + ',' + lightness + ')';
}
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
	setParam(this, setup, 'title'           , ""           );
	setParam(this, setup, 'description'     , ""           );
	setParam(this, setup, 'href'            , ""           );
	setParam(this, setup, 'onClick'         , function(){} ); // called BEFORE checking for children and promoting to root
	setParam(this, setup, 'onBecomingRoot'  , function(){} );
	setParam(this, setup, 'children'        , []           );

	this._id = SpiralMenuItem.newId();

	this.click = function() {
		this.onClick();
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
	if(this.element) {
		this.element.spiralMenu.updateSlice(this);
	}
}
/*
 * return: SpiralMenuItem
*/
SpiralMenuItem.prototype.addChild = function(smi) {
	assertType(smi, SpiralMenuItem);
	this.children.push(smi);
	return this;
};

SpiralMenuItem.prototype.isLeaf = function() {
	return this.children.length === 0;
};

SpiralMenuItem.prototype.draw = function() {
	this.element = document.createElement('li');
	this.element.innerHTML = this.title;

	if(!this.isLeaf()) {
		var ul = document.createElement('ul');
		for (var i = 0; i < this.children.length; ++i){
			ul.appendChild(this.children[i].draw());
		}
		this.element.appendChild(ul);
	}

	return this.element;
};

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
	this.sliceCount = Math.min(this.maxSlices, this.currentRoot.children.length);
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

		this.svg.spiral = this.svg.group()
		                      .addClass('spiral');
	}

	// draw slices
	this.slices = [];
	for(var i = 0; i < this.sliceCount; ++i) {
		this.drawSlice(this.currentRoot.children[i], i);
	}

	// draw root
	this.svg.spiral.add(this.drawRoot());

	// draw title
	this.drawTitle();

	// begin autoscrolling
	if(this.autoScroll) {
		this.startAutoScroll();
	}
	return this.svg;
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
 * Creates the spiral menu's root element. Private, must be used after draw()
 * 
 * @return {Element} the root's group
 */
SpiralMenu.prototype.drawRoot = function() {
	var sm = this;
	var s = this.svg;
	var root = this.currentRoot;
	
	root.element = s.group();
	root.element.spiralMenu = sm;
	root.element.attr({
		class: 'root',
		title: root.title,
	});
	var group = root.element;
	group.node.style.transformOrigin = this.center.x + 'px ' + this.center.y + 'px';

	// create SVG circle
	var circle = this.drawInnerCircle(false);
	circle.attr({
		style: "fill: " + randColor()
	});
	group.add(circle);

	// create background image
	if (root.backgroundImage) {
		// create circle for clipping
		var topLeft = {
			x: this.center.x - this.innerRadius,
			y: this.center.y - this.innerRadius
		};
		var img = s.image(root.backgroundImage, topLeft.x, topLeft.y, this.innerRadius*2, this.innerRadius*2);
		img.attr({
			preserveAspectRatio: 'xMidYMid slice',
			clip: circle
		});
		group.add(img);

		if (this.animate) {
			//circle.animate({r: this.innerRadius}, 1000);
			Snap.animate(0, 1, function(factor){
				img.attr({
					width: factor*sm.innerRadius*2,
					height: factor*sm.innerRadius*2
				});
			}, this.animationLength);
		}
	} else {
		circle.addClass('main-shape');
	}

	if (this.animate) {
		//circle.animate({r: this.innerRadius}, 1000);
		Snap.animate(0, 1, function(factor){
			circle.attr({
				r: factor*sm.innerRadius
			});
		}, this.animationLength);
	}
	// create circle for text wrap
	// create text

	// dbl click handlers
	group.dblclick(function() {
		open(root.href);
	});

	// click handlers
	group.click(fixedCall(function() {
		sm.currentRoot.click();
		sm.clickHandler(false, sm.currentRoot);

		if (sm.currentRoot.parent) {
			sm.demoteRoot();
		}
	}, 1, 300));

	return root.element;
};

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

/**
 * Creates a spiral menu's slice element. Private, must be used after draw()
 * 
 * @param {SpiralMenuItem} smi - the item to create a slice for
 * @param {Number} index - the index on the circle
 * @return {Element} the slice's group
 */
SpiralMenu.prototype.drawSlice = function(smi, index) {
	var sm = this;
	var slices = this.sliceCount;

	var s = this.svg;
	smi.element = s.group();
	smi.element.spiralMenu = this;
	smi.element.attr({
		class: 'slice' + (smi.isLeaf()? ' leaf' : ''),
		title: smi.title
	});
	var group = smi.element;

	var pathStr = sm.createSlicePath(index);
	var slice = s.path(pathStr);
	slice.attr({
		style: "fill:" + randColor()
	});
	group.add(slice);

	// create background image
	if (smi.backgroundImage) {
		var bbox = slice.getBBox();
		var topLeft = {
			x: bbox.x,
			y: bbox.y
		}
		var img = s.image(smi.backgroundImage, topLeft.x, topLeft.y, bbox.w, bbox.h);
		img.attr({
			preserveAspectRatio: 'xMidYMid slice',
			clip: slice
		});
		group.add(img);
	} else {
		slice.addClass('main-shape');
	}

	// create slice for text wrap
	// create text

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


	// attach where necessary
	this.svg.spiral.add(group);
	this.slices[index] = {
		shape: slice,
		group: group,
		smi: smi
	};

	return smi.element;
};

SpiralMenu.prototype.promoteChild = function(newRoot) {
	var sm = this;

	// remove root
	this.currentRoot.element.remove();
	this.currentRoot.element = null;

	// remove all visible slices
	var newRootId = newRoot.getId();
	var sliceId = 0;
	for(var i = 0; i < this.sliceCount; ++i) {
		if(newRootId == this.slices[i].smi.getId()) {
			sliceId = i;
			continue; // will animate
		}
		this.slices[i].group.remove();
		this.slices[i].shape.remove();
	}


	// update root, creating way to go back if necessary
	newRoot.parent = this.currentRoot;
	this.currentRoot = newRoot;
	this.sliceCount = Math.min(this.maxSlices, newRoot.children.length);

	// animate slice to root
	this.slices[sliceId].shape.animate({
		d: sm.innerCirclePath()
	}, this.animationLength, mina.linear, function() {
		sm.slices[sliceId].shape.remove();
		sm.slices[sliceId].group.remove();

		// redraw
		sm.startIndex = 0;
		sm.draw();
	});
	sm.updateSlice(newRoot);
}

SpiralMenu.prototype.demoteRoot = function() {
	// remove root
	this.currentRoot.element.remove();
	this.currentRoot.element = null;

	// remove all children
	for(var i = 0; i < this.sliceCount; ++i) {
		this.slices[i].shape.remove();
		this.slices[i].group.remove();
	}

	// update root
	this.currentRoot = this.currentRoot.parent;

	this.draw();
}

SpiralMenu.prototype.updateSlice = function(smi) {
	var s = this.svg;

	// Update backgroundImage
	if(smi.backgroundImage) {
		// If we already had an image
		var img = smi.element.select('image');
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
				}, this.animationLength);
				img.inAnim()[0].status(anim.status());
			}
			
			img.attr({
				'xlink:href': smi.backgroundImage,
				x: Math.round(bbox.x),
				y: Math.round(bbox.y),
				width: Math.round(bbox.w),
				height: Math.round(bbox.h)
			});
			return;
		}

		// If we must now add an image
		var clipShape = smi.element.select('.main-shape');
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
		smi.element.add(img);
	}
}

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
		slice.group.remove();
		if (slice.shape.parent().type == 'clipPath') {
			slice.shape.parent().remove();
		} else {
			slice.shape.remove();
		}
	});
	this.slices.shift();

	// create new slice for next item
	var newSliceGroup = this.drawSlice(this.currentRoot.children[newI], this.sliceCount-1);
	var newSlice = this.slices[this.sliceCount - 1];
	newSlice.shape.attr({
		d: sm.createEmptySlicePath(this.sliceCount-1, 'end')
	});
	newSlice.group.attr({
		opacity: 0
	});
	newSlice.shape.animate({
		d: sm.createSlicePath(this.sliceCount-1)
	}, this.animationLength);
	newSlice.group.animate({
		opacity: 1
	}, this.animationLength);

	// move all the other slices forward 1
	for(var i = 0; i < this.slices.length - 1; ++i) {
		this.slices[i].shape.animate({
			d: sm.createSlicePath(i)
		}, this.animationLength);
		sm.updateSlice(sm.slices[i].smi);
	}
	this.startIndex++;

	return newSliceGroup;
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
		slice.group.remove();
		if (slice.shape.parent().type == 'clipPath') {
			slice.shape.parent().remove();
		} else {
			slice.shape.remove();
		}
	});
	this.slices.unshift({});
	this.slices.pop();

	// create new slice for next item
	var newSliceGroup = this.drawSlice(this.currentRoot.children[newI], 0);
	var newSlice = this.slices[0];
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
		sm.updateSlice(sm.slices[i].smi);
	}
	this.startIndex--;

	return newSliceGroup;
};

/**
 * Begins auto scrolling the UI.
 * 
 * @param {Number} ms - length of scroll interval. 
 */
SpiralMenu.prototype.startAutoScroll = function(ms) {
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