var WD = {};
WD.Entity = function(entity) {
	this.entity = entity;
}
/**
 * Gets the array of property's values. If not found, returns undefined.
 *
 * @param {String} prop - a property PID
 * @return {Array} of values or undefined
 */
WD.Entity.prototype.getClaim = function(prop) {
	return this.entity.claims[prop];
}

/**
 * Returns the first of the arguments that has 1 or more claims. If none
 * found, returns undefined.
 *
 * @param list of string property IDs
 * @return {Array} of values or undefined
 */
WD.Entity.prototype.getFirstClaim = function() {
	for (var i = 0; i < arguments.length; i++) {
		if(this.getClaim(arguments[i])) {
			return this.getClaim(arguments[i]);
		}
	};
	return undefined;
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