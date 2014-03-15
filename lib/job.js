
var requestLib = require('request');
var async = require('async');
var _ = require('lodash');
var pkg = require('../package.json');
var DEFAULT_HEADERS = {
  'user-agent': pkg.name+'/'+pkg.version
};

//job class
function Job(job, finalResults) {
  this.opts = job;
  this.next = nexter();
  _.bindAll(this);

  // if(!this.opts.name)
  //   return this.cb("'name' required");
  if(!_.isArray(this.opts.sequence))
    throw "requires a 'sequence'";

  if(typeof this.opts.maxSockets !== 'number')
    this.opts.maxSockets = 5;
  if(typeof this.opts.connections === 'number')
    this.opts.maxSockets = this.opts.connections;

  if(typeof this.opts.runs !== 'number')
    this.opts.runs = Infinity;
  if(typeof this.opts.duration !== 'number')
    this.opts.duration = Infinity;

  if(this.opts.runs === Infinity &&
     this.opts.duration === Infinity)
    this.opts.runs = 1;

  if(_.isArray(this.opts.origins))
    this.origins = this.opts.origins;
  else if(typeof this.opts.origin === 'string')
    this.origins = [this.opts.origin];
  else
    throw "requires an 'origin'";

  this.opts.headers = _.defaults(this.opts.headers || {}, DEFAULT_HEADERS);

  var i;
  for (i = 0; i < this.origins.length; i++)
    if(!/^https?:\/\/[^\/]+$/.test(this.origins[i]))
      throw "Invalid origin: '"+this.origins[i]+"', must be http[s]://host:port";

  for (i = 0; i < this.opts.sequence.length; i++) {
    var req = this.opts.sequence[i];

    if(!_.isObject(req))
      throw "sequence item (#{req}) must be an object";

    req.timeout = req.timeout || this.opts.timeout || 5000;
    req.method  = req.method || 'GET';
    req.path  = req.path || '';
    req.headers  = req.headers || {};
    req.expect = req.expect || { code: 200 };
    req.followRedirect  = req.followRedirect || false;

    if(req.expect.code && typeof req.expect.code !== 'number')
      throw "sequence property 'code' must be a number";

    if(req.expect.match) {
      if(typeof req.expect.match !== 'string')
        throw "sequence property 'match' must be a string";
      try {
        req.expect._re = new RegExp(req.expect.match);
      } catch(e) {
        throw "sequence property 'match' contains an invalid regex: "+req.expect.match;
      }
    }

    if(req.expect.contains && typeof req.expect.contains !== 'string')
      throw "sequence property 'contains' must be a string";

    if(req.forms && _.isArray(req.forms))
      req.form = this.next(req.forms);

    if(req.method === 'GET' && req.form)
      throw "sequence has method GET and form data";
  }

  //fork 'request' with n connections
  this.request = requestLib.defaults({
    pool: {maxSockets: this.opts.maxSockets}
  });

  this.stopped = false;
  this.running = 0;
  this.results = [];
  this.finalResults = finalResults;
}



Job.prototype.run = function(callback) {
  
  this.cb = callback;

  this.startTime = Date.now();

  for(var b = 0; b < Math.min(this.opts.maxSockets, this.opts.runs); ++b)
    this.runSequence();

  if(this.opts.duration !== Infinity)
    setTimeout(this.stop, this.opts.duration);
};

Job.prototype.stop = function() {
  this.stopped = true;
};

Job.prototype.runSequence = function() {
  if(this.stopped) return;
  if(this.running >= this.opts.runs) return;
  this.running++;

  //bind this cookie jar to this sequence
  async.mapSeries(
    this.opts.sequence,
    this.runRequest.bind(this, requestLib.jar()),
    this.ranSequence);
};

Job.prototype.ranSequence = function(err, results) {

  if(err)
    return this.done(err);

  this.results.push(results);

  if((!this.stopped || this.results.length < this.running) &&
     (this.results.length < this.opts.runs))
    process.nextTick(this.runSequence);
  else
    this.done();
};

Job.prototype.runRequest = function(jar, req, done) {
  var responseTime = Date.now();
  var expect = req.expect;
  //cleanse request object
  req = _.pick(req, 'method', 'form', 'followRedirect', 'timeout');
  req.url = this.next(this.origins) + req.path;
  req.jar = jar;
  req.headers = _.defaults({}, req.headers, this.opts.headers);

  var delay = this.requestDelay;

  this.request(req, function(err, res, body) {
    if(err)
      err = err.toString();
    else if(!res)
      err = '(no response)';
    else if(expect.code && expect.code !== res.statusCode)
      err = 'expected code: ' + expect.code +
                     ', got: ' + res.statusCode +
                     ' (for ' + req.method + ' ' + req.path + ')';
    else if(expect._re && !expect._re.test(body))
      err = 'expected body to match regex: ' + expect._re;
    else if(expect.contains && body.indexOf(expect.contains) === -1)
      err = 'expected body to contain string: ' + expect.contains;

    var results = { responseTime: Date.now() - responseTime, err: err };

    if(delay)
      setTimeout(done.bind(null, null, results), delay);
    else
      done(null, results);
  });
};

Job.prototype.done = function(err) {
  if(err)
    return this.cb(err);


  var finalResults = {
        paths: {}, errors: {}, pass: 0, fail: 0, total: 0,
        totalTime: Date.now() - this.startTime
      },
      finalTimes = [], s,r, res, req, path, pathData;

  for(s = 0; s < this.opts.sequence.length; ++s) {

    var req = this.opts.sequence[s],
        key = req.method+" "+req.path,
        times = [];

    //add to path
    if(finalResults.paths[key])
      pathData = finalResults.paths[key];
    else
      pathData = finalResults.paths[key] = { pass: 0, fail: 0, total: 0, times: [] };

    //calculate
    for(r = 0; r < this.results.length; ++r) {
      res = this.results[r][s];
      if(!res) res = {err:'(missing)'};
      pathData.total++;
      if(!res.err) {
        pathData.pass++;
      } else {
        if(finalResults.errors[res.err])
          finalResults.errors[res.err]++;
        else
          finalResults.errors[res.err] = 1;
        pathData.fail++;
      }
      pathData.times.push(res.responseTime);
    }
  }

  //calculate totals
  for(path in finalResults.paths) {
    pathData = finalResults.paths[path];
    pathData.avgResponseTime = avg(pathData.times);
    //delete array
    delete pathData.times;
    finalTimes.push(pathData.avgResponseTime);
    finalResults.pass += pathData.pass;
    finalResults.fail += pathData.fail;
    finalResults.total += pathData.total;
  }

  finalResults.avgResponseTime = avg(finalTimes);
  this.results = finalResults;
  this.cb(null, finalResults);
};

Job.prototype.toJSON = function() {
  return undefined;
};

//job runner
module.exports = Job;

//helper
var nexter = function() {
  //create 'next' functions which can get thrown away along with their data
  var next = function(arr) {
    var i = next.arrs.indexOf(arr);
    if(i === -1) {
      next.arrs.push(arr);
      i = next.arrs.indexOf(arr);
      next.counts[i] = 0;
    }
    return arr[ next.counts[i]++ % arr.length ];
  };
  next.counts = [];
  next.arrs   = [];
  return next;
};

var avg = function(arr) {
  return Math.round(arr.reduce(function(p,c) { return p+c; }, 0)/arr.length);
};
var rand = function(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
};

