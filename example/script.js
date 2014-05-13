(function() {

  // Our fake controller
  var myController = {
    m1: function(req, res, next) {
      console.log('Executing m1. These are my args:', req, res);
      next();
    },
    m2: function(req, res, next) {
      console.log('Executing m2');
      next();
    },
    m3: function(req, res, next) {
      console.log('Executing m3');
      next();
    }
  };

  var router = new Marionette.Router({
    controller: myController,

    appRoutes: {
      '': 'm1',
      'docs/:section/(:subsection)': [ 'm1', 'm2', 'm3' ],
      'pasta/:id': ['m1', 'm2'],
    }
  });

  window.router = router;

  Backbone.history.start({
    pushState: true,
    root: "/example/"
  });

})();
