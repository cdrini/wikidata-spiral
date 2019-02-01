

/**
 * @constructor
 * @param {Object} entity JSON of a WD entity
 */
WD.Entity = function(entity) {
  this.entity = entity;
}

/**
 * Gets the array of property's values. If not found, returns undefined.
 * @private
 * @param {String} prop a property PID (like 'P279')
 * @return {Array<object>|undefined} Array of JSON claim values
 */
WD.Entity.prototype._getClaim = function(prop) {
  return this.entity.claims[prop];
}

/**
 * Get's a claim's value. Uses the first statement.
 *
 * @param {String} prop a property PID
 * @return {String}
 */
WD.Entity.prototype.getClaimValue = function(prop) {
  var claim = this.entity.claims[prop];
  if(!claim) return undefined;

  // TODO: if there is a preferred statement, use it
  // TODO: else pick first normal ranked statement

  var statement = claim[0];
  var type = statement.mainsnak.snaktype;
  switch(type) {
    case 'value':
      return statement.mainsnak.datavalue.value;
    default:
      // TODO: Add other cases
      return statement.mainsnak.datavalue.value;
  }
}

/**
 * Returns the first of the arguments that has 1 or more claims. If none
 * found, returns undefined.
 *
 * @param {Array<String>} list of string property IDs (like ["P279"])
 * @return {Array<object>|undefined} JSON claims if any
 */
WD.Entity.prototype.getFirstClaim = function() {
  for (var i = 0; i < arguments.length; i++) {
    if(this._getClaim(arguments[i])) {
      return this._getClaim(arguments[i]);
    }
  };
  return undefined;
}

/**
 * Get the label for this entity in the first of the languages provided. If none
 * work, will just return any label. If nothing works at all, returns empty string.
 * 
 * @param {String|Array<String>} langs single language or list of languages to try
 * @return {String}
 */
WD.Entity.prototype.getLabel = function(langs) {
  if(langs instanceof String) {
    langs = [ langs ];
  }

  // iterate through langs until we find one we have
  for(var i = 0; i < langs.length; ++i) {
    if (langs[i] in this.entity.labels) {
      return this.entity.labels[langs[i]].value;
    }
  }

  // no luck. Try to return any label.
  for(var lang in this.entity.labels) {
    return this.entity.labels[lang].value;
  }

  // still nothing?!? return empty string
  return "";
}

/**
 * Get the Wikidata URL for this entity
 * @return {String}
 */
WD.Entity.prototype.getUrl = function() {
  return 'https://www.wikidata.org/wiki/' + this.entity.title;
}