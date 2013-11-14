

$.notify.defaults {position:'bottom left'}
error = (str) ->
  $.notify str

$ ->

  input = $(".input textarea")
  output = $(".output textarea")
  input.val DEFAULT_INPUT
  req = null

  $("button").click ->

    req.abort() if req

    json = input.val()

    try
      JSON.parse json
    catch e
      error "JSON Error: #{e}"
      return

    $("button").html("Loading...").attr("disabled","disabled")

    req = $.ajax
      type: 'POST'
      url: '/job'
      timeout: 0
      data: json

    req.always (result, status, err) ->
      $("button").html("Run").removeAttr("disabled")
      if status is 'success'
        output.val JSON.stringify result, null, 2
      else
        console.log result.responseText
        error "Error: #{result.responseText}"
    