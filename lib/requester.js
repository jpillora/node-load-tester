
var requestLib = require('request');
var async = require('async');
var _ = require('lodash');

//job class
function Job(job, callback) {
  this.opts = job;
  this.cb = callback;
  _.bindAll(this);

  if(!this.opts.name)
    return this.cb("'name' required");
  if(!_.isArray(this.opts.sequence))
    return this.cb("'" + this.opts.name + "' requires a 'sequence'");

  if(typeof this.opts.maxSockets !== 'number')
    this.opts.maxSockets = 5;
  if(typeof this.opts.connections === 'number')
    this.opts.maxSockets = 5;

  if(typeof this.opts.runs !== 'number')
    this.opts.runs = 1;

  this.request = requestLib.defaults({
    pool: {maxSockets: this.opts.maxSockets}
  });

  this.running = 0;
  this.results = [];

  console.log(this.opts);

  for(var b = 0; b < Math.min(this.opts.maxSockets, this.opts.runs); ++b)
    this.runSequence();
}

Job.prototype.runSequence = function() {
  if(this.running === this.opts.runs) return;
  this.running++;

  //bind this cookie jar to this sequence
  async.mapSeries(
    this.opts.sequence,
    this.runRequest.bind(this, requestLib.jar()),
    this.ranSequence);
};

Job.prototype.ranSequence = function(err, results) {

  this.results.push(results);

  if(this.results.length < this.opts.runs)
    process.nextTick(this.runSequence);
  else
    this.done();
};

Job.prototype.runRequest = function(jar, args, done) {

  if(!_.isArray(args))
    return this.done("sequence item must be an array");

  var method = args[0];
  var path = args[1];
  var url = (this.opts.baseUrl||'') + path;
  var form = args[2];
  var responseTime = Date.now();

  this.request({
    method: method,
    url: url,
    form: form,
    jar: jar
  }, function(err, res, body) {
    done(null, {
      path: path,
      responseTime: Date.now() - responseTime,
      httpError: err && err.toString(),
      statusCode: res && res.statusCode
      // body: body
    });
  });
};

Job.prototype.done = function() {

  var finalResults = { paths: {}, errors: [] }, finalTimes = [],
      s,r, res, req, method, path, pathData, times;

  for(s = 0; s < this.opts.sequence.length; ++s) {

    req = this.opts.sequence[s],
    method = req[0], path = req[1],
    key = method+" "+path, times = [];

    //add to path
    if(finalResults.paths[key])
      pathData = finalResults.paths[key];
    else
      pathData = finalResults.paths[key] = { pass: 0, fail: 0, total: 0, times: [] };

    //calculate
    for(r = 0; r < this.results.length; ++r) {
      res = this.results[r][s];
      pathData.total++;
      if(res && !res.httpError && res.statusCode === 200) {
        pathData.pass++;
      } else {
        finalResults.errors.push(res ? (res.httpError || res.statusCode) : '(missing)');
        pathData.fail++;
      }
      pathData.times.push(res.responseTime);
    }
  }

  //calculate totals
  for(path in finalResults.paths) {
    pathData = finalResults.paths[path];
    pathData.responseTime = avg(pathData.times);
    //delete array
    delete pathData.times;
    finalTimes.push(pathData.responseTime);
  }

  finalResults.responseTime = avg(finalTimes);
  this.cb(null, finalResults);
};

//job runner
module.exports = function(job, callback) {
  module.exports.jobs.push(new Job(job, callback));
};
module.exports.jobs = [];


//helper

var avg = function(arr) {
  return arr.reduce(function(p,c) { return p+c; }, 0)/arr.length;
};

