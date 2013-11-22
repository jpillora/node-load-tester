



# $ ->

#   input = $(".input textarea")
#   output = $(".output textarea")
#   input.val DEFAULT_INPUT
#   req = null

#   $("button").click ->

#     req.abort() if req

#     json = input.val()

#     try
#       JSON.parse json
#     catch e
#       error "JSON Error: #{e}"
#       return

#     $("button").html("Loading...").attr("disabled","disabled")



App.run () ->


