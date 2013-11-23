App.factory 'jobs', ($rootScope, $http, $q) ->

  scope = window.jobs = $rootScope.$new true

  scope.run = (data) ->

    d = $q.defer()

    xhr = new XMLHttpRequest

    xhr.open 'POST', '/job'

    xhr.onreadystatechange = ->
      if xhr.readyState is 2
        console.log 'headers', xhr.getAllResponseHeaders()

      if xhr.readyState is 4
        console.log 'done!'

        if xhr.status is 200
          success(xhr.responseText)
        else
          error(xhr.responseText)


    xhr.setRequestHeader 'Content-type', 'application/json'
    xhr.send JSON.stringify data

    success = (data) ->
      console.log data
      d.resolve data
  
    error = (data) ->
      console.error data
      d.reject data
  
    d.promise


  scope

