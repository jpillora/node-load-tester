(function() {
  var App,
    __slice = [].slice;

  App = angular.module("load-tester", []);

  App.controller('Input', function($scope, jobs) {
    var copy, input, scope;
    scope = window.sc = $scope;
    scope.methods = ["GET", "POST", "PUT", "DELETE"];
    scope.expects = {
      status: "Status Code",
      contains: "Body Contains",
      match: "Body Matches"
    };
    input = scope.input = {
      origin: 'http://echo.jpillora.com',
      duration: 5000,
      runs: void 0,
      connections: 1,
      sequence: [
        {
          method: "GET",
          path: '/'
        }, {}
      ]
    };
    scope.check = function() {
      var arr, f, fields, hasAll, i, missingOne, obj, spare, _i, _j, _len, _len1;
      arr = arguments[0], fields = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      spare = -1;
      hasAll = true;
      for (i = _i = 0, _len = arr.length; _i < _len; i = ++_i) {
        obj = arr[i];
        missingOne = false;
        for (_j = 0, _len1 = fields.length; _j < _len1; _j++) {
          f = fields[_j];
          if (!obj[f]) {
            missingOne = true;
            break;
          }
        }
        if (missingOne) {
          if (!hasAll) {
            spare = i;
          }
          hasAll = false;
        }
      }
      if (hasAll) {
        arr.push({});
      } else if (!hasAll && spare >= 1) {
        arr.splice(spare, 1);
      }
    };
    copy = function(src) {
      var dst, k, keyVal, o, obj, v, _i, _len;
      if (typeof src !== "object") {
        return src;
      }
      dst = src instanceof Array ? [] : {};
      for (k in src) {
        v = src[k];
        if (/^\$/.test(k)) {
          continue;
        } else if (typeof v === "function") {
          continue;
        } else if (typeof v === "object") {
          v = copy(v);
          if (Object.keys(v).length > 0) {
            dst[k] = v;
          }
        } else if (typeof v === "string" && /^\d+(\.\d+)?$/.test(v)) {
          dst[k] = parseFloat(v);
        } else {
          dst[k] = v;
        }
      }
      if (dst instanceof Array) {
        obj = {};
        keyVal = true;
        for (_i = 0, _len = dst.length; _i < _len; _i++) {
          o = dst[_i];
          if (o.key && o.value) {
            obj[o.key] = o.value;
          } else {
            keyVal = false;
          }
        }
        if (keyVal) {
          dst = obj;
        }
      }
      return dst;
    };
    scope.getInput = function() {
      return copy(input);
    };
    scope.start = function() {
      var data;
      if (scope.loading) {
        return;
      }
      data = scope.getInput();
      scope.loading = true;
      return jobs.run(data);
    };
    scope.stop = function() {
      if (!(scope.loading && scope.polling)) {
        return;
      }
      return jobs.stop();
    };
    jobs.$on('started', function() {
      return scope.polling = true;
    });
    jobs.$on('cancelled', function() {
      return scope.polling = false;
    });
    jobs.$on('finished', function() {
      scope.polling = false;
      return scope.loading = false;
    });
  });

  App.controller('Output', function($scope, jobs) {
    $scope.results = "";
    jobs.$on('started', function(event, index) {
      return $scope.results = "started job #" + index + "...";
    });
    jobs.$on('progress', function(event, job) {
      return $scope.results = JSON.stringify(job, null, 2);
    });
    jobs.$on('finished', function(event, job) {
      return $scope.results = JSON.stringify(job, null, 2);
    });
  });

  App.factory('jobs', function($rootScope, $http, $q, $timeout) {
    var jobIndex, jobs, poll;
    jobs = window.jobs = $rootScope.$new(true);
    jobIndex = null;
    poll = function() {
      if (typeof jobIndex !== 'number') {
        return;
      }
      return $http.get('/job/' + jobIndex).success(function(job) {
        if (job.finished) {
          jobIndex = null;
          return jobs.$emit('finished', job);
        } else {
          jobs.$emit('progress', job);
          return $timeout(poll, 1000);
        }
      }).error(function(err) {
        console.error(err);
        return jobs.$emit('error', err);
      });
    };
    jobs.run = function(data) {
      if (jobIndex !== null) {
        return;
      }
      return $http.post('/job', data).success(function(job) {
        jobIndex = job.index;
        jobs.$emit('started', job.index);
        return poll();
      }).error(function(err) {
        console.error("job error", err);
        return jobs.$emit('error', err);
      });
    };
    jobs.stop = function() {
      if (jobIndex === null) {
        return;
      }
      return $http["delete"]('/job/' + jobIndex).success(function(job) {
        console.log('stopped job', jobIndex);
        return jobs.$emit('cancelled', job);
      }).error(function(err) {
        console.error("job error", err);
        return jobs.$emit('error', err);
      });
    };
    return jobs;
  });

  App.run(function() {});

}).call(this);
