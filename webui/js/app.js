(function() {
  $(function() {
    var input, output, req;
    input = $(".input textarea");
    output = $(".output textarea");
    input.val(INIT);
    req = null;
    return $("button").click(function() {
      var e, json;
      if (req) {
        req.abort();
      }
      json = input.val();
      try {
        JSON.parse(json);
      } catch (_error) {
        e = _error;
        output.val("JSON Error: " + e);
        return;
      }
      output.val("loading...");
      req = $.ajax({
        type: 'POST',
        url: '/run',
        data: json
      });
      return req.always(function(result, status) {
        if (status === 'success') {
          return output.val(JSON.stringify(result, null, 2));
        } else {
          return output.val("Error: " + JSON.stringify(result, null, 2));
        }
      });
    });
  });

}).call(this);
