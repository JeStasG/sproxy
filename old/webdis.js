var Resque, Webdis, startup_callback;

phantom.injectJs("underscore.js");

Webdis = (function() {
  Webdis.prototype.msgtoken = "SPLAT: ";

  function Webdis(host, port, startup_callback, resque) {
    var onAlert, onLoadFinished, self;
    this.host = host;
    this.port = port;
    this.callbacks = {};
    this.startup_callback = startup_callback;
    this.resque = resque;
    this.ready = false;
    this.page = require("webpage").create();
    self = this;
    onLoadFinished = function(status) {
      var jqueryconflictresolver;
      self.page.injectJs("jquery.js");
      jqueryconflictresolver = function() {
        return window.$ = jQuery.noConflict(true);
      };
      self.page.evaluate(jqueryconflictresolver);
      self.ready = true;
      return self.startup_callback(self.resque);
    };
    onAlert = function(message) {
      var callback, callbackid, jsonmsg, msg, rediscmd, webdismsg, webdisresp;
      if (!(message.substring(0, self.msgtoken.length) === self.msgtoken)) {
        return console.log(message);
      } else {
        jsonmsg = message.substring(self.msgtoken.length, message.length);
        msg = JSON.parse(jsonmsg);
        callbackid = msg["callbackid"];
        webdismsg = msg["webdismsg"];
        rediscmd = null;
        if (msg["rediscmd"] !== null && msg["rediscmd"] !== void 0) {
          rediscmd = msg["rediscmd"];
        }
        if (callbackid === null || callbackid === void 0) {
          return;
        }
        callback = self.callbacks[callbackid];
        if (callback === null || callback === void 0) {
          return;
        }
        if (rediscmd !== null) {
          webdisresp = JSON.parse(webdismsg[rediscmd]);
        } else {
          webdisresp = webdismsg;
        }
        self.remove_callback_by_id(callbackid);
        return callback(webdisresp);
      }
    };
    this.page.onAlert = onAlert;
    this.page.onConsoleMessage = function(x) {
      return console.log(x);
    };
    this.page.open("http://" + this.host + ":" + this.port + "/lpush", onLoadFinished);
  }

  Webdis.prototype.execute = function(url, callback, rediscmd) {
    var evil, evilargs, storedid;
    storedid = this.store_callback(callback);
    evilargs = {
      msgtoken: this.msgtoken,
      url: url,
      callbackid: storedid,
      rediscmd: rediscmd
    };
    evil = function(args) {
      var callbackid, msgtoken, supercallback;
      msgtoken = args.msgtoken;
      url = args.url;
      callbackid = args.callbackid;
      rediscmd = args.rediscmd;
      supercallback = function(webdis_response) {
        var jsonified, payload;
        payload = {
          rediscmd: rediscmd,
          callbackid: callbackid,
          webdismsg: webdis_response
        };
        jsonified = JSON.stringify(payload);
        if (callbackid !== void 0 && callbackid !== null) {
          return alert(msgtoken + jsonified);
        }
      };
      return window.$.get(url, supercallback);
    };
    return this.page.evaluate(evil, evilargs);
  };

  Webdis.prototype.construct_request = function(components) {
    var url;
    url = "http://" + this.host + ":" + this.port + "/" + components.join("/");
    return url;
  };

  Webdis.prototype.store_callback = function(callback) {
    var id;
    id = _.keys(this.callbacks).length;
    this.callbacks[id] = callback;
    return id;
  };

  Webdis.prototype.find_callback_id = function(callback) {
    var i, id, len, pcallback, ref;
    ref = this.callbacks;
    for (pcallback = i = 0, len = ref.length; i < len; pcallback = ++i) {
      id = ref[pcallback];
      if (pcallback === callback) {
        return id;
      }
    }
    return false;
  };

  Webdis.prototype.remove_callback = function(callback) {
    var id;
    id = this.find_callback_id(callback);
    if (id !== false) {
      this.callbacks[id] = null;
      return true;
    }
    return false;
  };

  Webdis.prototype.remove_callback_by_id = function(id) {
    this.callbacks[id] = null;
    return true;
  };

  Webdis.prototype.release = function() {
    this.page.release();
    return this.ready = false;
  };

  Webdis.prototype.push = function(key, value) {
    var cmd, r, url;
    cmd = ["LPUSH", key, value];
    url = this.construct_request(cmd);
    return r = this.execute(url);
  };

  Webdis.prototype.pop = function(key, callback) {
    var cmd, r, url;
    cmd = ["RPOP", key];
    url = this.construct_request(cmd);
    return r = this.execute(url, callback, "RPOP");
  };

  return Webdis;

})();

Resque = (function() {
  function Resque(host, port, startup_callback) {
    this.host = host;
    this.port = port;
    this.webdis = new Webdis(host, port, startup_callback, this);
  }

  Resque.prototype.push = function(queue, object) {
    var key;
    key = "resque:queue:" + queue;
    object = JSON.stringify(object);
    return this.webdis.push(key, object);
  };

  Resque.prototype.pop = function(queue, callback) {
    var key;
    key = "resque:queue:" + queue;
    return this.webdis.pop(key, callback);
  };

  return Resque;

})();

startup_callback = function(resque) {
  var moviemonster, moviemonsterandexit;
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
  moviemonsterandexit = function(movie) {
    moviemonster(movie);
    return phantom.exit();
  };
  return queue.pop("movies", moviemonsterandexit);
};