var samples = [
	{
		desc: 'Created by da Vinci',
		root: 'Q762',
		property: 'P170'
	}
];

var opts = {
	root: 'Q5582',
	property: 'P170',
	langs: ['en', 'fr'],
	maxSlices: 12
};

var defaultOpts = JSON.parse(JSON.stringify(opts)); //HACK, HACK, HACK, HACK

function findLabel(entity) {
	// try for lan
	var label = entity.getLabel(lang);
}
function findImage(entity, smi) {
	var imgs = entity.getClaim('P18');
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
		opts[params[i].param] = params[i].value;
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
			if(data.length > opts.maxSlices) {
				console.warn("Too many slices (" + data.length + ")! Showing only top " +  opts.maxSlices + ".");
				data = data.slice(0, opts.maxSlices);
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
							animate: false
						});
					}

					sm.draw();
				});
	  });
}

function clickHandler(isChild, smi) {
	if(!isChild && !smi.parent) {
		console.log("TODO");
		return;
	}

	if(smi.isLeaf()) {
		// load more
		go(smi.entity.id,opts.property);
	}
}

parseURL();
go(opts.root, opts.property);