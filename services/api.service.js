(function () {
    'use strict';

    angular
        .module('tools')
        .factory('APIService', APIService);

    APIService.$inject = ['$http'];
    function APIService($http){
		
        var service = {};

		service.Fields = Fields;
		service.Fix = Fix;
		
        return service;

		
		function Fields( version ){
			return $http.post( 'https://dev.gunbot.tools/json/' + version + '.json' ).then( handleSuccess, handleError( 'Field endpoint error' ) );
		}
		
		function Fix( data ){
			return $http.post( 'https://dev.gunbot.tools/backend/fix.php', data ).then( handleSuccess, handleError( 'Field endpoint error' ) );
		}

        function handleSuccess( response ){
			return response.data;
		}
		
        function handleError( error ) {
			return function(){
                return { success: false, message: error };
			};
        }
		
    }

})();
