var nodes = new SpiralMenuItem({ title: 'My Root',
	backgroundImage: 'http://pixabay.com/static/uploads/photo/2014/10/13/17/52/flamingo-487039_640.jpg',
	children: [
		new SpiralMenuItem({ title: 'option a',
			backgroundImage: 'http://pixabay.com/static/uploads/photo/2013/03/02/18/13/flamingo-89367_640.jpg'
		}),
		new SpiralMenuItem({ title: 'option b',
			backgroundImage: 'http://pixabay.com/static/uploads/photo/2013/03/11/22/28/animal-92728_640.jpg'
		}),
		new SpiralMenuItem({ title: 'option c',
			backgroundImage: 'http://pixabay.com/static/uploads/photo/2015/02/18/05/16/flamingos-640306_640.png'
		}),
		new SpiralMenuItem({ title: 'option d',
			backgroundImage: 'http://pixabay.com/static/uploads/photo/2015/03/16/22/41/flamingo-676954_640.jpg',
			children: [
				new SpiralMenuItem({ title: 'sub-option a',
					backgroundImage: 'http://pixabay.com/static/uploads/photo/2014/09/15/12/16/pelicans-446864_640.jpg'
				}),
				new SpiralMenuItem({ title: 'sub-option b' }),
				new SpiralMenuItem({ title: 'sub-option c' })
			]
		}),
		new SpiralMenuItem({ title: 'option e',
			backgroundImage: 'http://pixabay.com/static/uploads/photo/2014/11/15/20/42/flamingo-532672_640.jpg'
		})
	]
});

var sm = new SpiralMenu({
	root: nodes,
	size: 600,
	animate: false
});

sm.draw();