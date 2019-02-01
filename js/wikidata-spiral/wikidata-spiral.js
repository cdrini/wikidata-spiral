var DEFAULT_OPTS = {
  root: 'Q5582',
  property: 'P170',
  langs: ['en', 'fr'],
  pageSize: 49,
  slices: 12,
  autoScroll: false,
  wdq: 'CLAIM[$property:$root]',
  sparql: 'SELECT ?x WHERE { ?x wdt:$property wd:$root }',
  pageStart: 0,
  unicodeIcons: false // forces text icon to always show
};

var OPT_ALIASES = {
  query: 'wdq'
};

var userOpts = parseURLParams(DEFAULT_OPTS, OPT_ALIASES);
var opts = buildFullOpts(DEFAULT_OPTS, userOpts);

/**
 * Makes a query for the slices of qid using opts.query. Accepts
 * 2 variables in the query, $property and $root, corresponding to
 * opts.property and the current root.
 *
 * @param {String} prop - Property (ex: 'P279')
 * @param {String} qid - QID of root (ex: 'Q2095')
 * @return {Promise<String[]>} QIDs of all slices
 */
function getSlices(prop, qid) {
  if (userOpts.wdq) {
    var query = decodeURIComponent(opts.wdq);
    query = query.replace(/\$root/g, qid.slice(1));
    query = query.replace(/\$property/g, prop.slice(1));
    return WD.WDQ(query);
  }
  else {
    // Default to sparql
    var query = decodeURIComponent(opts.sparql);
    query = query.replace(/\$root/g, qid);
    query = query.replace(/\$property/g, prop);
    // support shorthand SPARQL
    if (query.indexOf('{') == -1) {
      var prefix = 'SELECT ?x WHERE { ';
      var suffix = ' }';

      if (query.trim().slice(0,2) != '?x') {
        prefix += ' ?x ';
      }
      query = prefix + query + suffix;
    }
    return WD.WDQS(query);
  }
}

var rootNode;
var sm;

// the initializing function which loads the root and its children
function go(rootId, prop) {
  getSlices(opts.property, rootId)
  .then(function(data) {
    if(!data.length) return;

    var totalItems = data.length;
    var unloadedChildren = [];
    if(data.length > opts.pageSize) {
      console.log("Showing first " +  opts.pageSize + " slices  of " + data.length + ".");

      // data shrunk to first opts.pageSize elements, remaining put in unloadedChildren
      unloadedChildren = data.splice(opts.pageSize);
    }

    WD.getQIDs([rootId].concat(data))
    .done(function(data, textStatus, jqXHR) {
      var rootEntity = new WD.Entity(data.entities[rootId]);

      // Create new SMI for root
      rootNode = spiralMenuItemFromEntity(rootEntity, opts);
      rootNode.unloadedChildren = unloadedChildren; // for 'load more' option
      rootNode.expectedLength = totalItems;

      // load children and add to rootNode
      for (var qid in data.entities) {
        if (qid == rootId) continue;

        var childEntity = new WD.Entity(data.entities[qid]);
        var child = spiralMenuItemFromEntity(childEntity, opts);
        rootNode.addChild(child);
      }

      // if there are unloaded children, add node at end to load more
      if (unloadedChildren.length) {
        var loadMoreChild = new SpiralMenuItem({
          title: 'load more',
          textIcon: '+',
          onClick: loadMoreChildren
        });
        rootNode.addChild(loadMoreChild);
      }

      // draw!
      if(!sm) {
        sm = new SpiralMenu({
          root: rootNode,
          size: 600,
          animate: false,
          maxSlices: opts.slices,
          autoScroll: opts.autoScroll,
          onClick: clickHandler,
          pageStart: opts.pageStart,
          alwaysShowTextIcon: opts.unicodeIcons
        });

        sm.on('scroll', function() {
          var sm = this;
          var bounds = sm.getPageBounds();
          $('.scroll-indicator').text(
            (bounds.first+1) + '-' + (bounds.last+1) +
            ' / ' + sm.currentRoot.expectedLength);
        });
      }

      var svg = sm.draw();
      svg.insertBefore(Snap('.scroll-indicator'));
    });
  });
}


function clickHandler(isChild, smi) {
  if(!smi.entity) {
    // clicked on a non-wd-item slice
    return;
  }

  if(!isChild && !smi.parent) {
    // should try to find a parent, displaying options if multiple options
    // exist
    console.log("TODO");
    return;
  }

  if(smi.isLeaf()) {
    // must load children
    // TODO: add loading class to slice only?
    Snap('svg').addClass('loading')
    .attr({
      'pointerEvents': 'none' // avoid clicking while we're loading content
    });

    loadChildren(smi, smi.entity.entity.id, opts.property);
  }
}

function loadChildren(node, qid, prop){
  getSlices(prop, qid)
  .then(function(data) {
      if(!data.length) {
        return Snap('svg').removeClass('loading')
          .attr({
            'pointerEvents': ''
          }); // avoid double clicking;
      }

      node.expectedLength = data.length;
      if(data.length > opts.pageSize) {
        console.log("Showing first " +  opts.pageSize + " slices of " + data.length + ".");

        // data shrunk to first opts.pageSize elements, remaining put in unloadedChildren
        node.unloadedChildren = data.splice(opts.pageSize);
      }

      WD.getQIDs(data)
      .done(function(data, textStatus, jqXHR){
        // create smi's for children
        for(var qid in data.entities) {
          var childEntity = new WD.Entity(data.entities[qid]);
          var child = spiralMenuItemFromEntity(childEntity, opts);
          node.addChild(child);
        }

        // if there are unloaded children, add node at end to load more
        if(node.unloadedChildren) {
          var loadMoreChild = new SpiralMenuItem({
            title: 'load more',
            textIcon: '+',
            onClick: loadMoreChildren
          });
          node.addChild(loadMoreChild);
        }

        // redraw
        Snap('svg').removeClass('loading');
        sm.promoteChild(node);
        Snap('svg').attr({
          'pointerEvents': ''
        }); // avoid double clicking
      });
  });
}

/**
 * Loads/appends another page of data to the spiral
 * @param {SpiralMenuItem} smi the "Load more" smi
 */
function loadMoreChildren(smi) {
  var root = sm.currentRoot;

  // slide back to hide plus
  sm.previous();

  var ids = root.unloadedChildren.splice(0, opts.pageSize);
  WD.getQIDs(ids)
  .done(function(data, textStatus, jqXHR){
    root.removeChild(smi);

    // create smi's for children
    for(var qid in data.entities) {
      var childEntity = new WD.Entity(data.entities[qid]);
      var child = spiralMenuItemFromEntity(childEntity, opts);
      root.addChild(child);
    }

    // add load more button again
    if(root.unloadedChildren.length) {
      root.addChild(smi);
    }

    // slide forward one
    sm.next();
  });
}

go(opts.root, opts.property);

function forward(e) {
  sm.next();
}
function backward(e) {
  sm.previous();
}
$(document).on('keyup', null, 'space', forward);
$(document).on('keyup', null, 'right', forward);
$(document).on('keyup', null, 'down', forward);

$(document).on('keyup', null, 'shift+space', backward);
$(document).on('keyup', null, 'left', backward);
$(document).on('keyup', null, 'up', backward);

$(document.body).on('wheel', ignoreSpam(function(e) {
  e.preventDefault();
  if (e.originalEvent.deltaY > 0) backward(e); else forward(e);
}, 30));

var touchStartY = 0;
Snap(document.body).touchstart(function(ev) {
  touchStartY = ev.changedTouches[0].pageY;
});

Snap(document.body).touchend(function(ev) {
  var touchEndY = ev.changedTouches[0].pageY;

  if(Math.abs(touchEndY - touchStartY) < 10) return;

  if(touchEndY - touchStartY > 0) {
    // scroll up
    backward(ev);
  } else if (touchEndY - touchStartY < 0) {
    // scroll down
    forward(ev);
  }
});

$('a.examples').on('click', function(ev) {
  ev.preventDefault();
  $('a.examples').toggleClass('active');
  $('#examples').fadeToggle(100);
});
