(function(Backbone) {

  Marionette.Router = Marionette.AppRouter.extend({

    constructor: function(options){
      this.routeParams = {};
      Marionette.AppRouter.prototype.constructor.apply(this, arguments);
    },

    // Verifies that the route(s) exist on the controller
    _addAppRoute: function(controller, route, methods){

      // Process a single method
      if (_.isString(methods)) {
        methods = this._verifyCallback(controller, methods);
      }

      // Process an array of methods
      else {
        methods = _.map(methods, function(methodName) {
          return this._verifyCallback(controller, methodName);
        }, this);
      }

      this.route(route, methods);
    },

    // Verify that the method exists on the controller; throw an error
    // if it doesn't. If found, returns the bound method.
    _verifyCallback: function(controller, methodName) {
      var method = controller[methodName];

      if (!method) {
        throwError("Method '" + methodName + "' was not found on the controller");
      }

      return _.bind(method, controller);
    },

    // Creates the request object to pass to the callbacks, which contains
    // the query parameters, as well as the named url parameters from the
    // Backbone route
    _getRequest: function(route, fragment) {
      var routeParams = this._extractParameters(route, fragment);
      var queryString = routeParams.pop();
      
      return {
        query:  this._getQueryParameters(queryString),
        params: this._getNamedParams(route, routeParams)
      };
    },

    // Get the response object. This is just an empty object; your callbacks
    // can construct it as they go.
    _getResponse: function(route) {
      return {};
    },

    onRoute: function() {
      console.log('The last callback has been executed.');
    },

    route: function(route, methods) {
      // Route to regExp if it's a regex
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);

      var router = this;
      Backbone.history.route(route, function(fragment) {
        // var args = router._extractParameters(route, fragment);

        var req = router._getRequest(route, fragment);
        var res = router._getResponse();
        var done = router.onRoute;

        // Execute a single method
        if (typeof methods === 'function') {
          methods(req, res, done);
        }

        // Execute a chain of methods
        else {
          var index = 0;
          var callback;
          (function nextCallback() {
            callback = methods[index++];

            if (!callback) {
              callback = done;
            }

            callback(req, res, nextCallback);
          })();
        }

        // Todo: Determine what args to pass, and fire the events
        // Todo: Why does it fire on the Backbone.history object?
        // if (router.execute(callback, args, name) !== false) {
        //   router.trigger.apply(router, ['route:' + name].concat(args));
        //   router.trigger('route', name, args);
        //   Backbone.history.trigger('route', router, name, args);
        // }
      });
      return this;
    },

    // Override this method to save the named URL parameters to an array
    _routeToRegExp: function(route) {
      this.routeParams[route] = this.routeParams[route] || [];
      var self = this;
      var optionalParam = /\((.*?)\)/g;
      var namedParam    = /(\(\?)?:\w+/g;
      var splatParam    = /\*\w+/g;
      var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;
      var tmpArray = [];
      var newRoute = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     tmpArray.push(match.substr(1));
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      var regexStr = '^' + newRoute + '(?:\\?([\\s\\S]*))?$'
      self.routeParams[regexStr] = tmpArray;
      return new RegExp(regexStr);
    },

    // Decodes the Url query string parameters, and returns them
    // as an object
    _getQueryParameters: function(queryString) {
      if (!queryString) {
        return {};
      }
      var params = {},
        match,
        // Regex for replacing the addition symbol with a space
        pl = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
      while (match = search.exec(queryString)) {
        params[decode(match[1])] = decode(match[2]);
      }
      return params;
    },

    // Returns the named parameters of the route
    _getNamedParams: function(route, routeParams) {
      var routeString = route.toString();
      routeString = routeString.substr(1, routeString.length-2);
      var routeArr = this.routeParams[routeString];
      var paramObj = {};
      _.each(routeArr, function(arrVal, i) {
        paramObj[arrVal] = routeParams[i];
      })
      return paramObj;
    },
  });

})(Backbone);
