(function() {
  var App;

  App = angular.module("load-tester", []);

  App.controller('Input', function($scope, jobs) {
    var input, scope;
    scope = window.sc = $scope;
    input = scope.input = {
      origin: 'http://echo.jpillora.com',
      duration: 5000,
      runs: void 0,
      connections: 1,
      sequence: [
        {
          method: 'GET',
          path: '/'
        }
      ]
    };
    scope.updateSeqence = function() {
      var full, h, i, spare, _i, _len, _ref;
      spare = -1;
      full = true;
      _ref = input.sequence;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        h = _ref[i];
        if (!h.method || !h.path) {
          if (!full) {
            spare = i;
          }
          full = false;
        }
      }
      if (full) {
        return input.sequence.push({});
      } else if (!full && spare >= 1) {
        return input.sequence.splice(spare, 1);
      }
    };
    scope.updateSeqence();
    scope.getInput = function() {
      var copy;
      copy = _.merge({}, input);
      copy.sequence = [];
      input.sequence.forEach(function(seq) {
        var k, s, v;
        if (seq.method && seq.path) {
          s = {};
          for (k in seq) {
            v = seq[k];
            if (/^\$/.test(k)) {
              s[k] = v;
            }
          }
          copy.sequence.push(s);
        }
      });
      return copy;
    };
    scope.start = function() {
      var data;
      if (scope.loading) {
        return;
      }
      data = scope.getInput();
      scope.loading = true;
      return jobs.run(data)["finally"](function() {
        return scope.loading = false;
      });
    };
  });

  App.controller('Output', function($scope, jobs) {
    $scope.results = "";
    jobs.$on('results', function(event, results) {
      return $scope.results = JSON.stringify(results, null, 2);
    });
  });

  App.factory('jobs', function($rootScope, $http, $q) {
    var jobs;
    jobs = window.jobs = $rootScope.$new(true);
    jobs.run = function(data) {
      return $http.post('/job', data).success(function(results) {
        console.log("job results", results);
        return jobs.$emit('results', results);
      }).error(function(err) {
        console.error("job error", err);
        return jobs.$emit('error', err);
      });
    };
    return jobs;
  });

  App.run(function() {});

}).call(this);
