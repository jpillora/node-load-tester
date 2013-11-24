App.factory 'jobs', ($rootScope, $http, $q) ->

  jobs = window.jobs = $rootScope.$new true

  jobs.run = (data) ->
    $http.post('/job', data).
      success((results) ->
        console.log "job results", results
        jobs.$emit 'results', results
      ).
      error((err) ->
        console.error "job error", err
        jobs.$emit 'error', err
      )

  jobs

