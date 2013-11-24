
App.controller 'Output', ($scope, jobs) ->

  $scope.results = ""
  jobs.$on 'results', (event, results) ->
    $scope.results = JSON.stringify results, null, 2


  return


    # req = $.ajax
    #   type: 'POST'
    #   url: '/job'
    #   timeout: 0
    #   data: json

    # req.always (result, status, err) ->
    #   $("button").html("Run").removeAttr("disabled")
    #   if status is 'success'
    #     output.val JSON.stringify result, null, 2
    #   else
    #     console.log result.responseText
    #     error "Error: #{result.responseText}"

