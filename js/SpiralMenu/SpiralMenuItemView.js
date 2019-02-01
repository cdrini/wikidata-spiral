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
    style: "fill:" + smi.fill
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

  if(smi.textIcon || !smi.backgroundImage || sm.alwaysShowTextIcon) {
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
  group.touchstart(function() {
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
  var shape = s.path(sm.innerCirclePath());
  shape.attr({
    style: "fill: " + smi.fill
  });
  group.add(shape);

  // create shadow circle
  var shadowCircle = s.path(sm.innerCirclePath());
  shadowCircle.attr({ class: 'shadow-circle' });
  group.add(shadowCircle);

  // create hover group
  if (smi.parent) {
    group.addClass('has-parent');
    var hoverGroup = s.group();
    hoverGroup.attr({ class: 'hover-group' });

    // circle
    var hoverCircle = s.path(sm.innerCirclePath());
    hoverCircle.attr({ class: 'hover-circle' });
    hoverGroup.add(hoverCircle);
    // Arrow
    var arrow = s.path('m 31,2 0,60 M 2,31 31,2 59.75,31');
    arrow.attr({
      class: 'up-arrow',
      style: 'stroke:#f9f9f9;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;opacity:0.75;fill: none;'
    });
    var arrow_w = 61.842;
    var arrow_h = 64;
    var arrow_x = sm.center.x - arrow_w/2; // center
    var arrow_y = sm.center.y - arrow_h - sm.innerRadius*.25;
    arrow.transform('translate(' + arrow_x + ', ' + arrow_y + ')');
    hoverGroup.add(arrow);

    // text
    var hoverText = s.text(sm.center.x, sm.center.y + sm.innerRadius*.2, [smi.parent.title]);
    hoverText.select('tspan').attr({
      class: 'root-title',
      textAnchor: 'middle',
      alignmentBaseline: 'middle'
    });
    hoverGroup.add(hoverText);

    group.add(hoverGroup);
  }

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
  var sm = this.sm;
  var smi = this.smi;

  // Update backgroundImage
  if(smi.backgroundImage) {
    // If we already had an image
    var img = this.group.select('image');
    if(img) {
      var clipPathId = img.attr('clip-path').match(/#[^\)\"]*/);
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
  if (!sm.alwaysShowTextIcon && smi.backgroundImage && smi.textIconText && !smi.textIcon) {
    this.group.select('.text-icon').remove();
    delete smi.textIconText;
  }

  // make sure text is on top
  if (sm.alwaysShowTextIcon) {
    this.group.append(this.group.select('.text-icon'));
  }

  // Update textIcon location
  if(sm.alwaysShowTextIcon || smi.textIcon || !smi.backgroundImage) {
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
      // if last slice, must decrement pageStart
      if (args[0].view.index == sm.sliceCount) {
        // FIXME should decrement
      }

      sm.redraw();
    }
    break;
  }
};