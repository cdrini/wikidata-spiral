var WD = {};
WD.Entity = function(entity) {
	this.entity = entity;
}
WD.Entity.prototype.getClaim = function(prop) {
	return this.entity.claims[prop];
}
WD.Entity.prototype.getLabel = function(langs, returnObject) {
	if(langs instanceof String) {
		langs = [ langs ];
	}

	// iterate through langs until we find one we have
	for(var i = 0; i < langs.length; ++i) {
		var obj = this.entity.labels[langs[i]];
		if(obj) {
			if (returnObject) {
				return obj;
			} else {
				return obj.value;
			}
		}
	}

	// no luck. Try to return any label.
	for(var lang in this.entity.labels) {
		if(returnObject) {
			return this.entity.labels[lang];
		} else {
			return this.entity.labels[lang].value;
		}
	}

	// still nothing?!? return empty string
	return "";
}
WD.Entity.prototype.getUrl = function() {
	return 'https://www.wikidata.org/wiki/' + this.entity.title;
}