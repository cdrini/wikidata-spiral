View it [here](https://rawgit.com/cdrini/wikidata-spiral/master/index.html).
Only tested on latest version of Google Chrome!

![Demo image](https://raw.githubusercontent.com/cdrini/wikidata-spiral/master/imgs/Created%20by%20van%20Gogh.png)

Originally created as a means to explore Wikidata's subclass hierarchy, Wikidata Spiral proved to be more useful in visualizing art. However it is generic enough to explore almost any property. One limitation of this view is that it depends on the presence of the image property on entities (which is why it works so well for artists). Hopefully this will promote the addition of more images to Wikidata.

# Usage
* Use the left/right or up/down arrows to scroll through the slices.
* Hovering over a slice will display its label.
* Clicking one a slice will attempt to set the slice as the root, finding new slices which have `CLAIM[$property:$newRoot]`. This is useful for properties such as P279 (subclass of), P171 (parent taxon), or P131 (located in the administrative territorial entity).
* Double clicking on a slice will open its corresponding Wikidata page.

## Parameters
(Accessible as URL parameters)

Name          | Type          | Default                    | Description
------------- | ------------- | -------------------------- | -------------
root          | QID           | Q5582                      | The item displayed as root.
property      | PID           | P170                       | The property to follow. The spiral's slices are determined by `CLAIM[$property:$root]` (or whatever is specified in the `wdq` or `sparql` parameters).
langs         | CSV           | en,fr                      | The language(s) to pull label names as.
slices        | Integer       | 12                         | The number of slices to display at a time.
autoScroll    | Boolean       | false                      | Whether the spiral should automatically scroll.
wdq           | WDQ           | `CLAIM[$property:$root]`   | The Wikidata Query used to determine slices. See [WDQ's Documentation](https://wdq.wmflabs.org/api_documentation.html) for help. The variables `$property` and `$root` are available for use in the query.
sparql        | SPARQL        | `SELECT ?x WHERE { ?x wdt:$property wd:$root }` | The SPARQL query used to determine the slices. The children should be in the variable `?x`. See [WDQS](https://query.wikidata.org/) for examples. The variables `$property` and `$root` are available for use in the query. <br/> Also supports "short" SPARQL excluding the `SELECT` (ex: `?x wdt:P31 wd:$root`) or excluding the `?x` as well (ex: <code>wdt:P279&#124;wdt:P31 wd:$root</code>).
unicodeIcons  | Boolean       | false                      | Whether to use unicode characters (`P487`) instead of label's first letter as an icon for each slice. Also forces the letters to show above images.

### Deprecated Parameters
Please do not use these.

Name          | Type          | Default                    | Description
------------- | ------------- | -------------------------- | -------------
query         | WDQ           | `CLAIM[$property:$root]`   | Renamed to `wdq`.

## Examples
* Subclasses of food: [root=Q2095&property=P279](https://rawgit.com/cdrini/wikidata-spiral/master/index.html?root=Q2095&property=P279)
* Subtaxons of all life forms: [root=Q2382443&property=P171](https://rawgit.com/cdrini/wikidata-spiral/master/index.html?root=Q2382443&property=P171) (can you find humans?)
* Created by van Gogh: [root=Q5582&property=P170&slices=9](https://rawgit.com/cdrini/wikidata-spiral/master/index.html?root=Q5582&property=P170&slices=9)
* Subclasses/instances of food: [root=Q2095&sparql=wdt:P279|wdt:P31 wd:$root](https://rawgit.com/cdrini/wikidata-spiral/master/index.html?root=Q2095&sparql=wdt:P279|wdt:P31 wd:$root) (most browsers should encode automatically)
* Fruits (using unicode icons):
[root=Q3314483&property=P279&unicodeIcons=true](https://rawgit.com/cdrini/wikidata-spiral/master/index.html?root=Q3314483&property=P279&unicodeIcons=true)

# Credits

## APIs/resources
* [Wikidata](https://www.wikidata.org/w/api.php)
* [Wikidata Query](https://wdq.wmflabs.org/), by Magnus Manske
* [Wikidata Query Service](https://query.wikidata.org/)
* [Wikimedia Commons](https://commons.wikimedia.org/w/api.php) for images

## Third party libraries
* [Snap.svg](https://github.com/adobe-webplatform/Snap.svg)
* [jQuery](https://github.com/jquery/jquery)
* [jQuery Hotkeys](https://github.com/jeresig/jquery.hotkeys)
