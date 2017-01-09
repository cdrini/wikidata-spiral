var samples = [
	{
		desc: 'Created by van Gogh',
		root: 'Q5582',
		property: 'P170'
	},
	{
		desc: 'Created by da Vinci',
		root: 'Q762',
		property: 'P170'
	},
	{
		desc: 'Subclasses of Food',
		root: 'Q2095',
		property: 'P279'
	}
];

var defaultOpts = {
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

var optAliases = {
	query: 'wdq'
};

var userOpts = parseURLParams(defaultOpts, optAliases);
var opts = buildFullOpts(defaultOpts, userOpts);

function isBoolean(bool) {
	return bool === true || bool === false;
}
function findLabel(entity) {
	// try for lan
	var label = entity.getLabel(lang);
}
function findImage(entity, smi) {
	var imgs = entity.getFirstClaim(
		'P18',      // image

		'P154',     // logo image

		'P41',      // flag image
		'P948',     // Wikivoyage banner
		'P692',     // Gene Atlas Image
		'P1766',    // place name sign
		'P94',      // coat of arms image
		'P242',     // locator map image
		'P15',      // road map
		'P1621',    // detail map
		'P1846',    // distribution map

		'P14',      // highway marker

		'P1801',    // commemorative plaque image
		'P1543',    // monogram
		'P158',     // seal image
		'P1442',    // image of grave
		'P109',     // signature

		'P367',     // astronomic symbol image
		'P491',     // orbit diagram
		'P117',     // chemical structure
		'P207',     // bathymetry image
		'P181'      // taxon range map image
	);

	if(!imgs) return null;

	return $.ajax({
	  url:'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iilimit=1&iiurlwidth=400&titles=' +
		   encodeURIComponent('File:' + imgs[0].mainsnak.datavalue.value),
	  dataType: 'jsonp',
	}).done(function(data, textStatus, jqXHR){
		var url;
		data = data.query.pages;
		for(var tmp in data) {
			data = data[tmp];
		}
		url = data.imageinfo[0].thumburl;
		smi.setBackgroundImage(url);
	});
}

function getFromQId(qid) {
	return $.ajax({
		url: "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=" + qid,
		dataType: "jsonp"
	});
}

function WDQ(query) {
	return $.ajax({
		url: 'https://wdq.wmflabs.org/api?q=' + encodeURIComponent(query),
		dataType: "jsonp"
	})
	.then(function(data) {
		return data.items.map(function (id) { return 'Q' + id; });
	});
}

function WDQS(query) {
	return $.ajax({
		url: "https://query.wikidata.org/sparql",
		data: {
			query: query,
			format: 'json'
		}
	})
	.then(function(data) {
		var itemVar = data.head.vars[0];
		return data.results.bindings
		.map(function(o) {
			return o[itemVar].value.replace("http://www.wikidata.org/entity/", "");
		});
	});
}

/**
 * Makes a query for the slices of qid using opts.query. Accepts
 * 2 variables in the query, $property and $root, corresponding to
 * opts.property and the current root.
 *
 * @param {String} prop - Property (ex: 'P279')
 * @param {String} qid - QID of root (ex: 'Q2095')
 */
function getSlices(prop, qid) {
	if (userOpts.wdq) {
		var query = decodeURIComponent(opts.wdq);
		query = query.replace(/\$root/g, qid.slice(1));
		query = query.replace(/\$property/g, prop.slice(1));
		return WDQ(query);
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
		return WDQS(query);
	}
}

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
		else if (isBoolean(defaultOpts[paramName])) {
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

function buildFullOpts(defaultOpts, userOpts) {
	var result = {};
	for (var key in defaultOpts) {
		result[key] = key in userOpts ? userOpts[key] : defaultOpts[key];
	}
	return result;
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

			var ids = data.join('|');
			getFromQId(rootId + '|' + ids)
				.done(function(data, textStatus, jqXHR){
					var rootEntity = new WD.Entity(data.entities[rootId]);

					// Create new SMI for root
					rootNode = new SpiralMenuItem({
						title:    rootEntity.getLabel(opts.langs),
						href:     rootEntity.getUrl(),
						textIcon: opts.unicodeIcons ? rootEntity.getClaimValue('P487') : undefined
					});
					findImage(rootEntity, rootNode);

					rootNode.entity = rootEntity;
					rootNode.unloadedChildren = unloadedChildren; // for 'load more' option
					rootNode.expectedLength = totalItems;

					// load children and add to rootNode
					for(var qid in data.entities) {
						if (qid == rootId) continue;

						var childEntity = new WD.Entity(data.entities[qid]);
						var child = new SpiralMenuItem({
							title:    childEntity.getLabel(opts.langs),
							href:     childEntity.getUrl(),
							textIcon: opts.unicodeIcons ? childEntity.getClaimValue('P487') : undefined
						});
						child.entity = childEntity;
						findImage(childEntity, child);
						rootNode.addChild(child);
					}

					// if there are unloaded children, add node at end to load more
					if(unloadedChildren.length) {
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
								(bounds.first+1) +'-' + (bounds.last+1) +
								' / ' + sm.currentRoot.expectedLength);
						});
					}

					var svg = sm.draw();
					svg.insertBefore(Snap('small'));
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

// loads on the children
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

			var ids = data.join('|');

			getFromQId(ids)
			.done(function(data, textStatus, jqXHR){
				// create smi's for children
				for(var qid in data.entities) {
					var childEntity = new WD.Entity(data.entities[qid]);
					var child = new SpiralMenuItem({
						title:    childEntity.getLabel(opts.langs),
						href:     childEntity.getUrl(),
						textIcon: opts.unicodeIcons ? childEntity.getClaimValue('P487') : undefined
					});
					child.entity = childEntity;
					findImage(childEntity, child);

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

// SpiralMenuItem click handler
// loads another page of data
function loadMoreChildren(smi) {
	var root = sm.currentRoot;

	// slide back to hide plus
	sm.previous();

	var ids = root.unloadedChildren.splice(0, opts.pageSize);
	ids = ids.join('|');

	getFromQId(ids)
	.done(function(data, textStatus, jqXHR){
		root.removeChild(smi);

		// create smi's for children
		for(var qid in data.entities) {
			var childEntity = new WD.Entity(data.entities[qid]);
			var child = new SpiralMenuItem({
				title: childEntity.getLabel(opts.langs),
				href: childEntity.getUrl()
			});
			child.entity = childEntity;
			findImage(childEntity, child);

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


opts.pageSize = 49;
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

$(document.body).on('mousewheel', function(e){
	e.preventDefault();
  if(e.originalEvent.wheelDelta /120 > 0) {
      backward(e);
  }
  else {
      forward(e);
  }
});

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
