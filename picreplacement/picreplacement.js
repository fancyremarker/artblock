var picreplacement = {

// data: {el, elType, blocked}
augmentIfAppropriate: function(data) {
  if (this._inHiddenSection(data.el)) {
    this._replaceHiddenSectionContaining(data.el);
  }
  else {
    var okTypes = (ElementTypes.image | ElementTypes.subdocument | ElementTypes["object"]);
    var replaceable = (data.el.nodeName !== "FRAME" && (data.elType & okTypes));
    if (data.blocked && replaceable)
      this._replace(data.el);
  }
},

_dim: function(el, prop) {
  function intFor(val) {
    // Match two or more digits; treat < 10 as missing.  This lets us set
    // dims that look good for e.g. 1px tall ad holders (cnn.com footer.)
    var match = (val || "").match(/^([1-9][0-9]+)(px)?$/);
    if (!match) return undefined;
    return parseInt(match[1]);
  }
  return ( intFor(el.getAttribute(prop)) ||
           intFor(window.getComputedStyle(el)[prop]) );
},

_parentDim: function(el, prop) {
  // Special hack for Facebook, so Sponsored links are huge and beautiful
  // pictures instead of tiny or missing.
  if (/facebook/.test(document.location.href))
    return undefined;
  var result = undefined;
  while (!result && el.parentNode) {
    result = this._dim(el.parentNode, prop);
    el = el.parentNode;
  }
  return result;
},

_targetSize: function(el) {
  var t = { x: this._dim(el, "width"), y: this._dim(el, "height") };
  // Make it rectangular if ratio is appropriate, or if we only know one dim
  // and it's so big that the 180k pixel max will force the pic to be skinny.
  if (t.x && !t.y && t.x > 400)
    t.y = 180000 / t.x;
  if (t.x && !t.y && t.x < 400)
    t.y = t.x;
  else if (t.y && !t.x && t.y > 400)
    t.x = 180000 / t.y;
  else if (t.y && !t.x && t.y < 400)
    t.x = t.y;
  return t;
},

// Given a target element, replace it with a picture.
// Returns the replacement element if replacement works, or null if the target
// element could not be replaced.
_replace: function(el) {
  var t = this._targetSize(el);

  // If we only have one dimension, we may choose to use the picture's ratio;
  // but don't go over 180k pixels (so e.g. 1000x__ doesn't insert a 1000x1000
  // picture (cnn.com)).  And if an ancestor has a size, don't exceed that.
  if (t.x && !t.y) {
    var newY = Math.round(Math.min(pic.y * t.x / pic.x, 180000 / t.x));
    var parentY = this._parentDim(el, "height");
    t.y = (parentY ? Math.min(newY, parentY) : newY);
  }
  if (t.y && !t.x) {
    var newX = Math.round(Math.min(pic.x * t.y / pic.y, 180000 / t.y));
    var parentX = this._parentDim(el, "width");
    t.x = (parentX ? Math.min(newX, parentX) : newX);
  }
  if (!t.x || !t.y || t.x < 40 || t.y < 40)
    return null; // unknown dims or too small to bother

  var iframe = document.createElement("iframe");
  iframe.style["height"] = t.y + "px";
  iframe.style["width"] = t.x + "px";
  iframe.src = "http://ads.artsy.net/?w=" + t.x + "&h=" + t.y;
  iframe.style["border"] = "none";
  iframe.style["padding"] = "none";
  iframe.style["margin"] = "none";
  iframe.style["float"] = (window.getComputedStyle(el)["float"] || undefined)

  // No need to hide the replaced element -- regular AdBlock will do that.
  el.dataset.picreplacementreplaced = "true";
  el.parentNode.insertBefore(iframe, el);

  return iframe;
},

// Returns true if |el| or an ancestor was hidden by an AdBlock hiding rule.
_inHiddenSection: function(el) {
  return window.getComputedStyle(el).orphans === "4321";
},

// Find the ancestor of el that was hidden by AdBlock, and replace it
// with a picture.  Assumes _inHiddenSection(el) is true.
_replaceHiddenSectionContaining: function(el) {
  // Find the top hidden node (the one AdBlock originally hid)
  while (this._inHiddenSection(el.parentNode))
    el = el.parentNode;
  // We may have already replaced this section...
  if (el.dataset.picreplacementreplaced)
    return;

  var oldCssText = el.style.cssText;
  el.style.setProperty("visibility", "hidden", "important");
  el.style.setProperty("display", "block", "important");

  this._replace(el);

  el.style.cssText = oldCssText; // Re-hide the section
}

}; // end picreplacement

if (!SAFARI) {
  chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
      if (request.command !== "picreplacement_inject_jquery")
        return; // not for us
      chrome.tabs.executeScript(undefined,
        {allFrames: request.allFrames, file: "jquery/jquery.min.js"},
        function() { sendResponse({}); }
      );
    }
  );
}

