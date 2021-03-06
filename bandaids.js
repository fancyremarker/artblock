var run_bandaids = function(blocking_style) {
  // Tests to determine whether a particular bandaid should be applied
  var apply_bandaid_for = "";
  if (/mail\.live\.com/.test(document.location.hostname))
    apply_bandaid_for = "hotmail";
  else if (/\.hk-pub\.com\/forum\/thread\-/.test(document.location.href))
    apply_bandaid_for = "hkpub";
  else if (blocking_style != "new" && /youtube/.test(document.location.hostname))
    apply_bandaid_for = "youtube";

  var bandaids = {
    hotmail: function() {
      var today = new Date();
      if (!(today < new Date(2012, 3, 1) || today >= new Date(2012, 3, 4)))
        return;
      //removing the space remaining in Hotmail/WLMail
      el = document.querySelector(".Unmanaged .WithSkyscraper #MainContent");
      if (el) {el.style.setProperty("margin-right", "1px", null);}
      el = document.querySelector(".Managed .WithSkyscraper #MainContent");
      if (el) {el.style.setProperty("right", "1px", null);}
    },

    hkpub: function() {
      //issue 3971: due to 'display:none' the page isn't displayed correctly
      el = document.querySelector("#AutoNumber1");
      if (el) {
        el.style.setProperty("width", "100%", null);
        el.style.setProperty("margin", "0", null);
      }
    },
    youtube: function() {
      function blockYoutubeAds(videoplayer) {
        var flashVars = videoplayer.getAttribute('flashvars');
        var inParam = false;
        if(!flashVars) {
            flashVars = videoplayer.querySelector('param[name="flashvars"]');
            // Give up if we still can't find it
            if(!flashVars)
                return;
            inParam = true;
            flashVars = flashVars.getAttribute("value");
        }
        var adRegex = /(^|\&)((ad_.+?|prerolls|interstitial)\=.+?|invideo\=true)(\&|$)/gi;
        if(!adRegex.test(flashVars))
            return;

        log("Removing YouTube ads");
        var adReplaceRegex = /\&((ad_\w+?|prerolls|interstitial|watermark|infringe)\=[^\&]*)+/gi;
        flashVars = flashVars.replace(adReplaceRegex, '');
        flashVars = flashVars.replace(/\&invideo\=True/i, '&invideo=False');
        flashVars = flashVars.replace(/\&ad3_module\=[^\&]*/i, '&ad3_module=about:blank');
        var replacement = videoplayer.cloneNode(true);
        if (inParam) {
            // Grab new <param> and set its flashvars
            newParam = replacement.querySelector('param[name="flashvars"]');
            newParam.setAttribute("value", flashVars);
        } else {
            replacement.setAttribute("flashvars", flashVars);
        }
        videoplayer.parentNode.replaceChild(replacement, videoplayer);
      }
      
      if (document.querySelector("#movie_player")) {
        //the movie player is already inserted
        blockYoutubeAds(document.querySelector("#movie_player"));
      } else {
        //otherwise it has to be inserted yet
        document.addEventListener("DOMNodeInserted", function(e) {
          if (e.target.id != "movie_player")
            return;
          blockYoutubeAds(e.target);
          this.removeEventListener('DOMNodeInserted', arguments.callee, false);
        }, false);
      }
    }
  }; // end bandaids

  if (apply_bandaid_for) {
    log("Running bandaid for " + apply_bandaid_for);
    bandaids[apply_bandaid_for]();
  }
}
