var path = require('path');
var express = require('express');
var http    = require('http');
var Job = require('./job');
var jobs = [];
var port = process.env.PORT || 3000;
var app = express();

var runQueue = function() {
  var nextJob;

  if(jobs.running)
    return;

  jobs.forEach(function(job) {
    if(!nextJob && !job.started && !job.finished) {
      nextJob = job;
    }
  });

  if(!nextJob)
    return;

  nextJob.started = true;

  nextJob.$job.run(function(err, result) {
    console.log("Finished job #%s", nextJob.index);
    delete nextJob.$job;
    nextJob.finished = true;
    nextJob.results = err || result;
    jobs.running = false;
    process.nextTick(runQueue);
  });
};


app.configure(function() {
  app.use(express.static(path.join(__dirname,'..','webui')));
  app.use(app.router);
  app.use(function(err, req, res) {
    err = err.stack || err;
    console.error('error', err);
    res.send(500, err);
  });
});

app.post('/job', function(req, res, next) {
  var json = '';
  req.on('data', function(buffer) {
    json += buffer.toString();
  });
  req.on('end', function() {
    try {
      var opts = JSON.parse(json);
      var results = {};
      var job = new Job(opts, results);
      var index = jobs.length;
      var queuedJob = {
        index: index,
        started: false,
        finished: false,
        request: opts,
        results: results,
        $job: job
      };
      jobs.push(queuedJob);
      process.nextTick(runQueue);
      console.log("Starting job #%s", index);
      res.send({index: index});
    } catch(e) {
      next(e);
    }
  });
});

app.get('/job/:index', function(req, res) {
  var i = req.params.index;
  var job = jobs[i];
  if(!job) return res.send(404, 'Could not find job #'+i);
  res.json(job);
});

app.del('/job/:index', function(req, res) {
  var i = req.params.index;
  var job = jobs[i];
  if(!job) return res.send(404, 'Could not find job #'+i);
  if(job.finished) return res.send(400, 'Already finished job #'+i);

  if(job.started) {
    job.$job.stop();
  } else {
    job.finished = true;
    job.results = { message:"cancelled by user" };
  }
  res.send({index:i});
});

var httpServer = http.createServer(app);

httpServer.listen(port, function() {
  console.log("Listening on %s", port);
});