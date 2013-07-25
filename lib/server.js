var express = require('express');
var requester = require('./requester');

var app = express();

app.configure(function() {
  app.use(app.router);

  app.use(function(req, res, next) {
    console.log('job', req.job);
    requester(req.job, function(err, result) {
      if(err) return next(err);
      res.json(result);
    });
  });

  app.use(function(err, req, res, next) {
    console.error('error', err.stack);
    res.send({error: err.toString()});
  });

});

app.post('/', function(req, res, next) {
  var json = '';
  req.on('data', function(buffer) {
    json += buffer.toString();
  });
  req.on('end', function() {
    try {
      req.job = JSON.parse(json);
      next();
    } catch(e) {
      next(e);
    }
  });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("listening...");
});