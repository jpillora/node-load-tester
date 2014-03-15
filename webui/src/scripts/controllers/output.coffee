
App.controller 'Output', ($scope, jobs) ->
  $scope.results = ""
  

  jobs.$on 'started', (event, index) ->
    $scope.results = "started job ##{index}..."

  jobs.$on 'progress', (event, job) ->
    $scope.results = JSON.stringify job, null, 2

  jobs.$on 'finished', (event, job) ->
    $scope.results = JSON.stringify job, null, 2

  return

