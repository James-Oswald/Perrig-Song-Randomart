
# Perrig-Song-Randomart

This package provides a (browser side) js module to generate randomart images
based on Perrig and Song's 1999 paper ["Hash Visualization: a New Technique to
improve Real-World Security"](https://people.eecs.berkeley.edu/~dawnsong/papers/randomart.pdf).
It supports the basic grammar given by Perrig and Song, as well as a restricted
subset of [Tsoding's](https://github.com/tsoding) 
[extended grammar](https://github.com/tsoding/randomart/blob/main/grammar.bnf) 
from his [C implementation](https://github.com/tsoding/randomart). 

## Example
Try it out on [The Example Deployment](https://james-oswald.github.io/Perrig-Song-Randomart/)

## Use

The core function of the library is a single function `randomart`, which
given an image size, string seed, and a slew of other optional parameters will generate an [ImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap) that can then be drawn to a canvas and from there turned into an image data object or saved etc.

From [the example website](https://github.com/James-Oswald/Perrig-Song-Randomart/blob/main/index.html)
```js
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const seed = "my seed";
const image = randomart(canvas.width, canvas.height, seed);
ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
image.close();
```

### Optional Parameters
* `grammar_name`: The grammar to use for generating the randomart, either `"perrig"`, `"tsoding"`, or `"oswald"`. Defaults to `"tsoding"`.
  * `"perrig"` uses the simple example grammar from the original paper. In general, it produces the "least interesting" images.
  * `"tsoding"` uses a limited subset of [tsoding's extended grammar](https://github.com/tsoding/randomart/blob/main/grammar.bnf)
     it generates fairly interesting images with occasional noise.
  * `"oswald"` extends the tsoding grammar with some additional trig functions, it generates the most complex images, but is often noisy.
* `depth` The "complexity" of the randomart, default to 15. Governs the size of the random expression tree generated, bigger expressions mean more complex and overlapping motifs in the resulting image.
WARNING: as this governs the depth of a tree, is an exponential parameter, higher values will cause potentially very long
generation times, and have a know issue corrupting WebGL on Firefox, requiring a browser restart. 20 is the recommended maximum to avoid lag. 
* `scale` How "zoomed out" the randomart is, defaults to 2.0. Some features are not visible at the base zoom, but in general interesting features
tend to clump up in the middle. Zooming out too far usually results in boring repeated patterns.

