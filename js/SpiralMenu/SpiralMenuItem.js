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
  setParam(this, setup, 'fill'            , randColor()  );
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
    this.children.splice(index, 1);
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