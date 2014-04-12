(function(global, factory) {

  // Set up BlackInkGallery properly for the environment. Start with Node.js
  if (typeof exports !== 'undefined') {
    var $ = require('jquery');
    module.exports = factory($);

  // Next, as a jQuery plugin
  } else {
    factory(global.jQuery);
  }

}(typeof window !== "undefined" ? window : this, function($) {

  var __slice = [].slice;

  // Constructor function
  var BlackInkGallery = function(el, options) {
    this.$el = $(el);
    this.options = options;
    this.$el.on("big.preprocessed", $.proxy(this.processFigures, this));
  };

  // Make sure we have data needed, e.g. image dimensions
  BlackInkGallery.prototype.preprocessFigures = function() {
    var $el       = this.$el
      , $figures  = $el.children()
      , numberOfFigures = $figures.length
      , numberOfFiguresLoaded = 0;

    // Set up width and height of each image
    $figures.each(function(index) {
      var $image = $(this).find("img").first();

      // Webkit browsers set the height and width property 
      // after the image is loaded. Create a memory copy of 
      // each image and set its width and height on loading.
      $(new Image()).load(function() {
        $image.data("width", this.width);
        $image.data("height", this.height);
        if (++numberOfFiguresLoaded == numberOfFigures) {
          // The second param of `trigger()` is an array of arguments.
          $el.trigger("big.preprocessed", $figures);
        }
      }).attr("src", $image.attr("src"));
    });
  };

  BlackInkGallery.prototype.processFigures = function(/* event, figure1, figure2, ... */) {
    var event     = arguments[0]
      , figures   = arguments.length >= 2 ? __slice.call(arguments, 1) : []
      , $figures  = $(figures);

    // If the browser supports different writing mode, render it horizontally;
    // otherwise, fall back and render it vertically.
    if ($('body')[0].style["-webkit-writing-mode"] != null) {
      this.horizontalScroll($figures);
    } else {
      this.verticalScroll($figures, { numberOfColumns: 6 });
    }
  };

  // Create vertical scrolling gallery, append artworks to the shortest column first.
  BlackInkGallery.prototype.verticalScroll = function($figures, options) {
    var $columns = []
      , columnHeights = []
      , numberOfColumns = options.numberOfColumns
      , $inner = $('<div class="big-inner"></div>');

    // Initialize
    for (var i = 0; i < numberOfColumns; i++) {
      $columns[i] = $('<div class="big-figure-column"></div>');
      columnHeights[i] = 0;
    }

    $figures.each((function(_this) {
      return function(index, figure) {
        var $image        = $(figure).find("img").first()
          , width         = $image.data("width")
          , height        = $image.data("height")
          , shortestIndex = 0
          , shortest      = columnHeights[shortestIndex];

        for (var i = 0, v; i < columnHeights.length; i++) {
          v = columnHeights[i];
          if (v < shortest) {
            shortest = v;
            shortestIndex = i;
          }
        }
        $columns[shortestIndex].append(_this.makeFigure($(figure), { captionFirst: false }));
        return columnHeights[shortestIndex] += 1 / width * height;
      };
    })(this));

    this.$el.addClass("black-ink-gallery vertical").html($inner.append($columns));
    this.postCreateGallery();
  };

  // 
  BlackInkGallery.prototype.makeFigure = function($original, options) {
    var $figure       = $('<div class="big-figure"></div>')
      , $caption      = $('<figurecaption class="big-figurecaption"></figurecaption>')
      , $content
      , $image        = $original.find("img").first()
      , caption       = $image.attr("data-caption")
      , _options      = options || {}
      , captionFirst  = _options.captionFirst || false
      , className;

    if (caption != null) {
      try {
        // if caption is a JSON string
        captions = JSON.parse(caption);
      } catch (e) {
        // else, treat it as a normal string
        captions = { caption: caption };
      }
      for (className in captions) {
        $caption.append('<p class="' + className + '">' + captions[className] + '</p>');
      }
    }
    $content = captionFirst ? [$caption, $original] : [$original, $caption];
    return $figure.append($content);
  };

  BlackInkGallery.prototype.horizontalScroll = function($figures, options) {
    var $el = this.$el
      , minHeight = 500
      , hwRatioThreshold = 1.5
      , figureGroup = []
      , $inner = $('<div class="big-inner"></div>')
      , $column;

    $figures.each(function(index, figure) {
      var $image  = $(figure).find("img").first()
        , w       = $image.data("width")
        , h       = $image.data("height");

      if (h > minHeight && h / w > hwRatioThreshold) {
        // portrait
        figureGroup.push($(figure));
      } else {
        // landscape
        figureGroup.push($(figure));
      }
    });

    // Set the gallery height to its parent's height
    $el.addClass("black-ink-gallery horizontal").css("height", $el.parent().height());

    for (var i = 0; i < figureGroup.length; i++) {
      $column = $('<div class="big-figure-column"></div>');
      $inner.append($column.append(this.makeFigure(figureGroup[i], { captionFirst: true })));
    }

    $el.html($inner);
    this.postCreateGallery();
  };

  // Do some effects after creating the gallery
  BlackInkGallery.prototype.postCreateGallery = function() {
    var $figures = this.$el.find('.big-figure');

    $figures.each(function(index, figure) {
      window.getComputedStyle(figure).opacity;
    });
    $figures.add(this.$el.find('img')).css("opacity", 1);
  };

  $.fn.blackInkGallery = function() {
    return this.each(function() {
      return (new BlackInkGallery(this)).preprocessFigures();
    });
  };

  return BlackInkGallery;

}));
