var ExampleHomePage, ExamplePage, Page, Spatula, alert, exit, log, queue, startup_callback, throwexit,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

phantom.injectJs("underscore.js");

phantom.injectJs("resque.js");

Array.prototype.remove = function(e) {
  return _(this).reject(function(v) {
    return v === e;
  });
};

log = function(message) {
  return console.log(message);
};

alert = function(message) {
  return log("ALERT: " + message);
};

exit = function() {
  log("exiting because exit was called");
  return phantom.exit();
};

throwexit = function(error) {
  var message;
  message = "\n\n\n";
  message += "ERROR: <" + error.message + ">";
  if (error.hasOwnProperty("lineNumber") && error.lineNumber !== null) {
    message += " on line " + error.lineNumber;
  }
  if (error.hasOwnProperty("fileName") && error.fileName !== null) {
    message += " in file " + error.fileName;
  }
  log(message);
  log("exiting because caught and escalated error/exception");
  return phantom.exit(1);
};

Page = (function() {
  Page.prototype.url = null;

  Page.prototype.settings = {
    loadImages: true,
    loadPlugins: true,
    javascriptEnabled: true,
    userAgent: "Spatula",
    jquery: true
  };

  Page.prototype.log = function(mexo) {
    return console.log("Page" + ": " + mexo);
  };

  function Page() {
    var i, len, override, overrides;
    this.current_analysis = {};
    this.transition_history = [];
    this.has_initialized = true;
    this.has_started = false;
    this.loaded = false;
    this.error = null;
    this.jquery_injected = false;
    this.page = require("webpage").create();
    overrides = ["settings", "onAlert", "onConsoleMessage", "onError", "onInitialized", "onLoadStarted", "onLoadFinished", "onResourceRequested", "onResourceReceived"];
    for (i = 0, len = overrides.length; i < len; i++) {
      override = overrides[i];
      if (this[override] !== null && this[override] !== void 0) {
        this.page[override] = this[override];
      }
    }
  }

  Page.prototype.start = function() {
    var onLoadFinished, onLoadStarted, self;
    this.log("start called, url is: " + this.url);
    this.has_started = true;
    self = this;
    onLoadFinished = function(status) {
      var analysis;
      self.log("onLoadFinished called");
      self.loaded = true;
      if (self.settings.jquery && !self.jquery_injected) {
        self.log("injecting jquery into the page");
        self.jquery_injected = true;
      }
      self.log("about to call analyze");
      return analysis = self.analyze();
    };
    onLoadStarted = function() {
      return self.loaded = false;
    };
    this.page.open(this.url, onLoadFinished);
    return this.log("start done... callback is onLoadFinished");
  };

  Page.prototype.run = function(method, callback_handler, passed_args) {
    var result;
    this.log("run called (with method and passed_args)");
    result = this.page.evaluate(method);
    if (typeof callback_handler === "function") {
      this.log("run calling callback_handler(result)");
      result = callback_handler(result);
    }
    this.log("run done");
    return result;
  };

  Page.prototype.analyzer = function() {
    var analysis;
    console.log("analyzer running inside the page");
    analysis = {
      state: null
    };
    console.log("analyzer done running inside the page");
    return analysis;
  };

  Page.prototype.analyze = function() {
    var analysis;
    this.log("analyze: injecting @analyzer");
    analysis = this.page.evaluate(this.analyzer);
    this.transition_history.push(analysis);
    this.previous_analysis = this.current_analysis;
    this.current_analysis = analysis;
    this.log("analyze: returning analysis");
    return analysis;
  };

  Page.prototype.transition = function() {
    console.log("transition: nothing to do, exiting...");
    return exit();
  };

  return Page;

})();

ExamplePage = (function(superClass) {
  extend(ExamplePage, superClass);

  function ExamplePage() {
    return ExamplePage.__super__.constructor.apply(this, arguments);
  }

  ExamplePage.prototype.url = "http://news.ycombinator.com";

  return ExamplePage;

})(Page);

ExampleHomePage = (function(superClass) {
  extend(ExampleHomePage, superClass);

  function ExampleHomePage() {
    return ExampleHomePage.__super__.constructor.apply(this, arguments);
  }

  ExampleHomePage.prototype.analyzer = function() {
    var analysis;
    console.log("analyzer running inside the page");
    analysis = {
      title: document.title,
      url: document.location.href
    };
    if (analysis.title === null || analysis.title === "") {
      analysis["state"] = "HAS_NO_TITLE";
    } else {
      analysis["state"] = "HAS_TITLE";
    }
    if (Math.floor(Math.random() * 4) === 3) {
      analysis["state"] = "SIMULATED_DISASTER";
    }
    console.log("analyzer done running inside the page");
    return analysis;
  };

  ExampleHomePage.prototype.transition = function() {
    var analysis, state;
    this.log("transition looking at the analysis");
    analysis = this.current_analysis;
    state = analysis["state"];
    if (state === "HAS_NO_TITLE") {
      this.run(this.set_title);
    } else if (state === "HAS_TITLE" || this.previous_analysis === null) {
      this.run(this.unset_title);
    } else {
      this.error = new Error("unknown state");
      this.loaded = false;
      throw this.error;
    }
    return this.log("transition done looking at the analysis");
  };

  ExampleHomePage.prototype.set_title = function() {
    return document.title = "hello world!";
  };

  ExampleHomePage.prototype.unset_title = function() {
    return document.title = "";
  };

  return ExampleHomePage;

})(ExamplePage);

Spatula = (function() {
  function Spatula() {
    this.has_started = false;
    this.pages = [];
  }

  Spatula.prototype.interval = 1000;

  Spatula.prototype.add_page = function(page) {
    if (page === null) {
      alert("page can't be null in add_page");
      throwexit("page can't be null in add_page");
    }
    if (!(page.hasOwnProperty("has_initialized") && page.has_initialized)) {
      page = new page;
    }
    return this.pages.push(page);
  };

  Spatula.prototype.main_loop = function() {
    var error, i, len, page, ref, x;
    if (!this.has_started) {
      alert("consider calling Spatula.start() instead of directly calling main_loop()");
    }
    ref = this.pages;
    for (i = 0, len = ref.length; i < len; i++) {
      page = ref[i];
      if (!(page.hasOwnProperty("has_initialized") && page.has_initialized) && !(page.hasOwnProperty("has_started") && page.has_started)) {
        page = page();
        page.start();
      } else if (!(page.hasOwnProperty("has_started") && page.has_started)) {
        log("page hasn't been started yet.. starting the page");
        page.start();
      } else if (!_.every((function() {
        var j, len1, ref1, results;
        ref1 = ["has_initialized", "has_started"];
        results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          x = ref1[j];
          results.push(page.hasOwnProperty(x));
        }
        return results;
      })(), _.identity)) {
        throwexit("page is missing some attributes (this shouldn't happen)");
      } else if (page.error) {
        log("removing a page from spatula.pages because of an error");
        this.pages.remove(page);
      } else if (page.loaded) {
        try {
          console.log("main_loop: calling transition on page");
          page.transition();
          console.log("main_loop: calling analyze on page");
          page.analyze();
        } catch (_error) {
          error = _error;
          throwexit(error);
        }
      }
    }
    if (this.pages.length === 0 && this.has_started) {
      return throwexit(new Error("main_loop called prior to adding any pages in spatula"));
    }
  };

  Spatula.prototype.start = function() {
    this.has_started = true;
    return window.setInterval(_.bind(this.main_loop, this), this.interval);
  };

  return Spatula;

})();

startup_callback = function(resque) {
  var moviemonster, spatula;
  console.log("starting a tiny spatula demo...");
  queue.push("movies", {
    "name": "short circuit"
  });
  queue.push("movies", {
    "name": "star wars episode iv"
  });
  queue.push("movies", {
    "name": "star wars episode v"
  });
  queue.push("movies", {
    "name": "star wars episode vi"
  });
  moviemonster = function(movie) {
    return console.log("movie name is: " + movie.name);
  };
  queue.pop("movies", moviemonster);
  queue.pop("movies", moviemonster);
  spatula = new Spatula(resque);
  spatula.add_page(ExampleHomePage);
  spatula.start();
  return console.log("spatula initiated");
};

queue = new Resque("localhost", "7379", startup_callback);

// ---
// generated by coffee-script 1.9.2