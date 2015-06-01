View it [here](https://rawgit.com/cdrini/wikidata-spiral/master/index.html)
![Demo image](https://raw.githubusercontent.com/cdrini/wikidata-spiral/master/imgs/Created%20by%20van%20Gogh.png)

Originally created as a means to explore Wikidata's subclass hierarchy, Wikidata Spiral proved to be more useful in visualizing art. However it is generic enough to explore almost any property. One limitation of this view is that it depends on the presence of the image property on entities (which is why it works so well for artists). Hopefully this will promote the addition of more images to Wikidata.

# Paramters
(Accessible via URL parameters)

Name          | Type          | Default       | Description
------------- | ------------- | ------------- | -------------
root          | QID           | Q5582         | The item displayed as root
property      | PID           | P170          | The property to follow. The spiral's slices are determined by ``CLAIM[$property:$root]``
langs         | CSV           | en,fr         | The language(s) to pull label names as.
slices        | Integer       | 12            | The number of slices to display at a time.
autoScroll    | Boolean       | false         | Whether the spiral should automatically scroll.

## Examples
Subclasses of food: [root=Q2095&property=P279](https://rawgit.com/cdrini/wikidata-spiral/master/index.html?root=Q2095&property=P279)
Created by van Gogh: [root=Q5582&property=P170&slices=9](https://rawgit.com/cdrini/wikidata-spiral/master/index.html?root=Q5582&property=P170&slices=9)

#Credits
* [Snap.svg](https://github.com/adobe-webplatform/Snap.svg)
* [jQuery](https://github.com/jquery/jquery)
* [jQuery Hotkeys](https://github.com/jeresig/jquery.hotkeys)