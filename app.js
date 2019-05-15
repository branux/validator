(function () {
	
	'use strict';
	
    angular
        .module('tools', ['ngRoute', 'ngCookies', 'ngAnimate', 'ui.bootstrap', 'ui.codemirror' ])
        .config(config)
		.controller(  'MainController', MainController )
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider', '$compileProvider' ];
    function config( $routeProvider, $locationProvider, $compileProvider ) {
        
		$compileProvider.debugInfoEnabled( false );
		$compileProvider.commentDirectivesEnabled( false );


		$locationProvider.html5Mode( true );
		
		$locationProvider.hashPrefix( '' );
		
		$routeProvider
			
			
            .when('/', {
                controller: 'IndexController',
                templateUrl: 'views/view.index.html',
				controllerAs: 'vm'
            })
			
            .otherwise({ redirectTo: '/' });
		
	}
	
    run.$inject = ['$rootScope', '$location', '$cookies', '$http' ];
    function run( $rootScope, $location, $cookies, $http ){
		

		//Say hey!
		console.log('%c GUNBOT TOOLS V1', 'background: #333; color: #f5e179; display: block; font-size: 16px; padding: 10px;');
		
		//Are we debugging?
		$rootScope.debug = false;
		
		//Set our global from cookies
		$rootScope.globals = $cookies.getObject( 'globals' ) || {};

		
    }
	
	//Main controller
	MainController.$inject = ['$rootScope', '$scope'];
	function MainController( $rootScope, $scope ){
		
		
		
		
		

    }



	

})();