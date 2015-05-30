// Get Snap.svg
var script = document.createElement('script');
script.src = "https://cdnjs.cloudflare.com/ajax/libs/snap.svg/0.3.0/snap.svg-min.js";
document.head.appendChild(script);


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
		this.element.spiralMenu.update(this);
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
	return this.children.length === 0 ? true : false;
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
	setParam(this, setup, 'root'            , null          );
	setParam(this, setup, 'size'            , 400           ); // in px
	setParam(this, setup, 'onClick'         , sampleClickFn ); 
	setParam(this, setup, 'animate'         , true          );
	setParam(this, setup, 'animationLength' , 500           ); // in ms
	
	this.sourceRoot = this.root;         // The 'true' root
	this.currentRoot = this.sourceRoot;  // The root as a result of navigation. Could change.

	this.clickHandler = this.onClick;

	this.titleSize = 60; //px

	this.canvasWidth = this.size + 2*this.titleSize; //left/right
	this.canvasHeight = this.size + this.titleSize;

	this.outerRadius = (this.size - 20)/2; // how much the circle will expand on hover(?)
	this.innerRadius = this.outerRadius*0.6;

	this.center = {
		x: this.size/2 + this.titleSize,
		y: this.size/2 + this.titleSize
	};

}

/**
 * Creates the spiral menu
 * 
 * @return {Element} the svg element
 */
SpiralMenu.prototype.draw = function() {
	
	// create svg
	if (!this.svg) {
		this.svg = Snap(this.canvasWidth, this.canvasHeight);

		this.svg.spiral = this.svg.group()
		                      .addClass('spiral');
	}

	// draw slices
	for(var i = 0; i < this.currentRoot.children.length; ++i) {
		var slice = this.drawSlice(this.currentRoot.children[i], i);
		this.svg.spiral.add(slice);
	}

	// draw root
	this.svg.spiral.add(this.drawRoot());

	// draw title
	this.drawTitle();

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
		return this.svg.path(circlePath((this.center.x, this.center.y, this.innerRadius)));
	}
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
 * @param {string} text - the new title
 * @return {Element} the title's element
 */
SpiralMenu.prototype.updateTitle = function(text) {
	return this.svg.title.textPath.node.innerHTML = text;
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
	// attach click handlers
	group.click(function() {
		sm.currentRoot.click();
		sm.clickHandler(false, sm.currentRoot);

		if (sm.currentRoot.parent) {
			sm.demoteRoot();
		}
	});

	return root.element;
};

/**
 * Creates a spiral menu's slice element. Private, must be used after draw()
 * 
 * @param {SpiralMenuItem} smi - the item to create a slice for
 * @param {Number} index - the index on the circle
 * @return {Element} the slice's group
 */
SpiralMenu.prototype.drawSlice = function(smi, index) {
	var sm = this;
	var children = this.currentRoot.children.length;

	var s = this.svg;
	smi.element = s.group();
	smi.element.spiralMenu = this;
	smi.element.attr({
		class: 'slice' + (smi.isLeaf()? ' leaf' : ''),
		title: smi.title
	});
	var group = smi.element;

	var PI = Math.PI;

	var sliceAngle = 2*PI / children;
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
	// attach click handlers
	group.click(function() {
		smi.click();
		sm.clickHandler(true, smi);

		if (!smi.isLeaf()) {
			sm.promoteChild(smi);
		}
	});

	// attach hover handlers
	group.hover(function() {
		sm.updateTitle(smi.title);
	}, function() {
		sm.updateTitle(sm.currentRoot.title);
	});

	// dbl click handlers
	group.dblclick(function() {
		open(smi.href);
	});

	return smi.element;
};

SpiralMenu.prototype.promoteChild = function(newRoot) {
	// remove root
	this.currentRoot.element.remove();
	this.currentRoot.element = null;

	// remove all other children
	var newRootId = newRoot.getId();
	for(var i = 0; i < this.currentRoot.children.length; ++i) {
		var smi = this.currentRoot.children[i];
		if (smi.getId() !== newRootId) {
			smi.element.remove();
			smi.element = null;
		}
	}

	// update root, creating way to go back if necessary
	newRoot.parent = this.currentRoot;
	this.currentRoot = newRoot;

	// redraw
	this.draw();
}

SpiralMenu.prototype.demoteRoot = function() {
	// remove all children
	for(var i = 0; i < this.currentRoot.children.length; ++i) {
		var smi = this.currentRoot.children[i];
		smi.element.remove();
		smi.element = null;
	}

	// update root
	this.currentRoot = this.currentRoot.parent;

	this.draw();
}

SpiralMenu.prototype.update = function(smi) {
	var s = this.svg;

	// Update backgroundImage
	if(smi.backgroundImage) {
		// If we already had an image
		var img = smi.element.select('image');
		if(img) {
			img.attr({
				'xlink:href': smi.backgroundImage
			});
			return;
		}

		// If we must now add an image
		var clipShape = smi.element.select('.main-shape');
		var bbox = clipShape.getBBox();

		var img = s.image(smi.backgroundImage,
			Math.round(bbox.x),
			Math.round(bbox.y),
			Math.ceil(bbox.w),
			Math.ceil(bbox.h));
		img.attr({
			preserveAspectRatio: 'xMidYMid slice',
			clip: clipShape
		});
		smi.element.add(img);
	}

}