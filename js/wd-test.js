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

var opts = {
	root: 'Q5582',
	property: 'P170',
	langs: ['en', 'fr'],
	pageSize: 49,
	slices: 12,
	autoScroll: false
};

var defaultOpts = JSON.parse(JSON.stringify(opts)); //HACK, HACK, HACK, HACK

function isBoolean(bool) {
	return bool === true || bool === false;
}
function findLabel(entity) {
	// try for lan
	var label = entity.getLabel(lang);
}
function findImage(entity, smi) {
	var imgs = entity.getClaim('P18') || // image
	           entity.getClaim('P41') || // flag
	           entity.getClaim('P948') || // wikivoyage banner
	           entity.getClaim('P94'); // coat of arms

	if(!imgs) return null;

	return $.ajax({
		url:'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iilimit=1&iiurlwidth=400&titles=' +
					encodeURIComponent('File:' + imgs[0].mainsnak.datavalue.value),
	  dataType: 'jsonp',
	  cache: true
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
	});
}

function hasClaim(prop, qid) {
	return WDQ('CLAIM[' + opts.property.slice(1) + ':' + qid.slice(1) + ']');
}
function parseURL() {
	var url = location.href;
	var params = url.match(/\?.*/);
	if(!params) return;
	params = params[0];

	params = params.slice(1).split('&')
						.map(function(p) {
							var pair = p.split('=');
							return {
								param: pair[0],
								value: pair[1]
							};
						});

	for(var i = 0; i < params.length; ++i) {
		if(opts[params[i].param] instanceof Array){
			opts[params[i].param] = params[i].value.split(',');
		} else if (isBoolean(opts[params[i].param])) {
			opts[params[i].param] = params[i].value === 'true' ? true : false;
		}	else {
			opts[params[i].param] = params[i].value;
		}
	}
}
var rootNode;
var sm;

function go(rootId, prop) {
// get all items with property:rootId
	hasClaim(opts.property, rootId)
		.done(function(data, textStatus, jqXHR) {
			data = data.items;

			if(!data.length) return;
			if(data.length > opts.pageSize) {
				console.warn("Too many slices (" + data.length + ")! Showing only top " +  opts.pageSize + ".");
				data = data.slice(0, opts.pageSize);
			}

			var ids = 'Q' + data.join('|Q');

			getFromQId(rootId + '|' + ids)
				.done(function(data, textStatus, jqXHR){
					var rootEntity = new WD.Entity(data.entities[rootId]);
					// Create new SMI for root
					rootNode = new SpiralMenuItem({
						title: rootEntity.getLabel(opts.langs),
						href: rootEntity.getUrl()
					});
					findImage(rootEntity, rootNode);

					rootNode.entity = rootEntity;

					// deal with children
					for(var qid in data.entities) {
						if (qid == rootId) continue;

						var childEntity = new WD.Entity(data.entities[qid]);
						var child = new SpiralMenuItem({
							title: childEntity.getLabel(opts.langs),
							href: childEntity.getUrl()
						});
						child.entity = childEntity;
						findImage(childEntity, child);
						rootNode.addChild(child);
					}

					// draw!
					if(!sm) {
						sm = new SpiralMenu({
							root: rootNode,
							size: 600,
							animate: false,
							maxSlices: opts.slices,
							autoScroll: opts.autoScroll,
							onClick: clickHandler
						});
					}

					var svg = sm.draw();
					svg.insertBefore(Snap('small'));
				});
	  });
}


function clickHandler(isChild, smi) {
	if(!isChild && !smi.parent) {
		console.log("TODO");
		return;
	}

	if(smi.isLeaf()) {
		// must load stuff
		Snap('svg').attr({
			'pointerEvents': 'none'
		}); // avoid double clicking
		loadChildren(smi, smi.entity.entity.id, opts.property);
	}
}

function loadChildren(node, qid, prop){
	hasClaim(prop, qid)
	.done(function(data, textStatus, jqXHR) {
			data = data.items;

			if(!data.length) {
				return Snap('svg').attr({
					'pointerEvents': ''
				}); // avoid double clicking;
			}

			if(data.length > opts.pageSize) {
				console.warn("Too many slices (" + data.length + ")! Showing only top " +  opts.pageSize + ".");
				data = data.slice(0, opts.pageSize);
			}

			var ids = 'Q' + data.join('|Q');

			getFromQId(ids)
			.done(function(data, textStatus, jqXHR){
				// create smi's for children
				for(var qid in data.entities) {
					var childEntity = new WD.Entity(data.entities[qid]);
					var child = new SpiralMenuItem({
						title: childEntity.getLabel(opts.langs),
						href: childEntity.getUrl()
					});
					child.entity = childEntity;
					findImage(childEntity, child);

					node.addChild(child);
				}

				// redraw
				sm.promoteChild(node);
				Snap('svg').attr({
					'pointerEvents': ''
				}); // avoid double clicking
			});
	});
}

parseURL();
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