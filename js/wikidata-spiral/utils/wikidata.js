/**
 * @param {WD.Entity} entity
 * @param {object} opts wikidata-spiral options
 * @return {SpiralMenuItem}
 */
function spiralMenuItemFromEntity(entity, opts) {
  var smi = new SpiralMenuItem({
    title: entity.getLabel(opts.langs),
    href: entity.getUrl(),
    textIcon: opts.unicodeIcons ? entity.getClaimValue('P487') : undefined
  });
  smi.entity = entity;
  _findImage(entity, smi);
  return smi;
}

/**
 * Adds an image to the spiral menu item if it can find one in the entity
 * @param {WD.Entity} entity
 * @param {SpiralMenuItem} smi
 */
function _findImage(entity, smi) {
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
    for (var tmp in data) {
      data = data[tmp];
    }
    url = data.imageinfo[0].thumburl;
    smi.setBackgroundImage(url);
  });
}