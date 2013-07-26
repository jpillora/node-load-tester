var path = require('path');
var express = require('express');
var requester = require('./requester');

var app = express();

app.configure(function() {

  app.use(express.static(path.join(__dirname,'..','webui')));

  app.use(app.router);

  app.use(function(err, req, res, next) {
    console.error('error', err.stack);
    res.send({error: err.toString()});
  });

});

app.post('/run', function(req, res, next) {
  var json = '';
  req.on('data', function(buffer) {
    json += buffer.toString();
  });
  req.on('end', function() {
    try {
      requester(JSON.parse(json), function(err, result) {
        if(err) return next(err);
        res.json(result);
      });
    } catch(e) {
      next(e);
    }
  });
});

app.get('/job/:index', function(req, res, next) {
  if(req.params.index && requester.jobs[req.params.index])
    return res.json(requester.jobs[req.params.index]);
  res.send(404, 'missing');
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("listening on %s...", port);
});