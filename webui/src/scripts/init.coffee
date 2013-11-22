#this file appears first

$.notify.defaults {position:'bottom left'}
error = (str) ->
  $.notify str

App = angular.module "load-tester", []