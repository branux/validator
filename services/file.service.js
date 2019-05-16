(function () {
	
	'use strict';
	
	angular.module('tools')
	.factory('readFile', function ($window, $q) {
		var readFile = function (file) {
			var deferred = $q.defer(),  
			reader = new $window.FileReader();
			reader.onload = function (ev) {
				var content = ev.target.result;
				deferred.resolve(content);
			};
			reader.readAsText(file);
			return deferred.promise;
		};
		return readFile;
	})

	.directive('fileBrowser', function (readFile) {
		return {
			template: '<input type="file" style="display: none;" accept="application/javascript, application/json, json" />' +
				'<ng-transclude></ng-transclude>',
			transclude: true,
			link: function (scope, element) {
				var fileInput = element.children( 'input[type="file"]' );
				fileInput.on('change', function (event) {
					scope.uploading = true;
					var file = event.target.files[0];
					readFile(file).then(function (content) {
						scope.upload = content;
						scope.uploading = false;
					});
				});
				element.on('click', function () {
					fileInput[ 0 ].click();
				});
			}
		};
	})

})();