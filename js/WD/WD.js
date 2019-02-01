/**
 * WD contains useful Wikidata-related APIs/types.
 */

var WD = {};

/**
 * Get full entity JSONs for the given ids.
 * Here's a sample response: https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q42
 * @param {Array<String>} qids (like ['Q42'])
 * @return {Promise<Object>}
 */
WD.getQIDs = function(qids) {
  qids = qids.join('|');
  return $.ajax({
    url: "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=" + qids,
    dataType: "jsonp"
  });
};

/**
 * Perform a Wikidata query query
 * @param {String} query wdq query
 * @return {Promise<String[]>} the matching QIDs
 */
WD.WDQ = function(query) {
  return $.ajax({
    url: 'https://wdq.wmflabs.org/api?q=' + encodeURIComponent(query),
    dataType: "jsonp"
  })
  .then(function(data) {
    return data.items.map(function (id) { return 'Q' + id; });
  });
};

/**
 * Perform a Wikidata Query Service query
 * @param {String} query SPARQL query
 * @return {Promise<String[]>} QIDs of matching binding values
 */
WD.WDQS = function(query) {
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