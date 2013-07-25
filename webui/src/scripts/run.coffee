
$ ->

  input = $(".input textarea")
  output = $(".output textarea")
  input.val INIT
  req = null

  $("button").click ->

    req.abort() if req

    json = input.val()

    try
      JSON.parse json
    catch e
      output.val "JSON Error: #{e}"
      return

    output.val "loading..."

    req = $.ajax
      type: 'POST'
      url: '/run'
      data: json

    req.always (result, status) -> 
      if status is 'success'
        output.val JSON.stringify result, null, 2
      else
        output.val "Error: #{result}"
    