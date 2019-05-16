(function () {
    'use strict';

    angular
        .module('tools')
        .controller('IndexController', IndexController);

    IndexController.$inject = ['$rootScope', '$scope', '$timeout', 'APIService'];
    function IndexController( $rootScope, $scope, $timeout, APIService ) {
	
		
		$scope.fields = false;
		$scope.config = '';
		$scope.errors = [];
		
		$scope.completed = false;
		$scope.validated = false;
		
		$scope.JSON_ERROR = false;
		
		$scope.version = "v12";
		$scope.repairing = false;
		
		$scope.showHelp = true;
		
		//Protected fields that should NEVER leave the browser. EVER.
		$scope.protected = {
			bot: {
				TOKEN: false,
				chat_id: false,
				withdraw_address: false,
				gunthy_wallet: false
			},
			imap_listener: {
				user: false,
				password: false
			}
		};
		
		$scope.exchanges = {};
		
		//Validate editor params
		$scope.parameters = {
			
			//Cm params
			lineNumbers: true,
			mode: "javascript",
			gutters: [ 'CodeMirror-linenumbers', 'errors' ],
			
			//When our editor is loaded
			onLoad: function( codeMirror ){
				
				//Create the validation function
				$scope.Validate = function(){
					
					//Some local variables
					var JSON_errors;
					var GUNBOT_errors;
					var ERRORS;
					
					//Loop through each line in the config, and add the error guttermarker
					codeMirror.eachLine( function( line ){
						
						codeMirror.setGutterMarker( line, 'errors', null );
						
					});
					
					//Get the errors
					JSON_errors = $scope.readJSON();
					GUNBOT_errors = $scope.readGunbot();
					
					//Clear any json errors
					$scope.JSON_error = false;
					
					//If we have a JSON error
					if( JSON_errors.length > 0 ){
						
						//Set the var
						$scope.JSON_error = true;
					
					}
					
					//Add both error arrays into our error response
					ERRORS = JSON_errors.concat( GUNBOT_errors );
					
					//Set the local errors var
					$scope.errors = ERRORS;
					
					//Loop through each of the errors
					angular.forEach( $scope.errors, function( error ){
						
						//Create a node on the editor
						var node = document.createElement( 'span' );
						
						//Add the tool error class
						node.classList.add( 'tool-error' );
					
						//Add the node to our editor at the specified line
						codeMirror.setGutterMarker( error.line - 1, 'errors', node );
						
					});
					
				};
				
			}
			
		};
		
		//When the config variable changes
		$scope.$watch( 'config', function(){
			
			//Validate it
			$scope.Validate();
			
		});
		
		
		
		//Whenever we change the validator version
		$scope.updateVersion = function(){
			
			//Fire off a request to get the field template for this version
			APIService.Fields( $scope.version ).then( function( response ){
				
				//Response is good
				if( response.response == 'OK' )
				{
					
					//Set the template fields
					$scope.fields = response.fields;
					
					//Revalidate the config against the new version
					$scope.Validate();
					
				}
				
			});
			
		};
		
		
		//On controller load
		(function initController(){
			
			//Fire off a request to get the field template for this version
			APIService.Fields( $scope.version ).then( function( response ){
				
				//Response is good
				if( response.response == 'OK' )
				{
					
					//Set the template fields
					$scope.fields = response.fields;
					
				}
				
			});
	
		})();
		
		
		
		
		
		
		
		
		$scope.Download = function(){
			
			var config = false;
			var valid = false;
			
			//Parse the JSON config in a TRY
			try{
				
				//Parse
				config = JSON.parse( $scope.config );
				
				//Set flag
				valid = true;
			
			}catch( e ){
				
				//JSON error
				valid = false;
			
			}
			
			//If the config is valid
			if( valid ){
				
				//Create an object DL in the window
				config = angular.toJson( config, true );
				var download = new Blob( [ config ], { type: "application/json;charset=utf-8;" } );
				var exportDate = new Date();
				var exportLink = angular.element( '<a></a>' );
				exportLink.attr( 'href', window.URL.createObjectURL( download ) );
				exportLink.attr( 'download', 'gunbot.tools_' + exportDate.toLocaleDateString() + '.json' );
				exportLink[ 0 ].click();
				
			}
			
			
		};
		
		
		
		
		
		
		$scope.Fix = function(){
			
			//Some local variables
			var valid = false;
			var config = false;
			
			//Clear exchange protected array
			$scope.exchanges = {};
			
			//Nasssttyyy hack - when chat_id is over 53 bits, javas-crap automatically converts it to a floating point. GREAT!!!!!
			//This replaces the long number with a string if it's over the 53 bit limit
			config = angular.copy( $scope.config );
			config = config.replace( /"chat_id"?\s*:?\s*([\d]+)/g, ' "chat_id": "$1" ');
			
			//Parse the JSON config in a TRY
			try{
				
				//Parse
				config = JSON.parse( config );
				
				//Set flag
				valid = true;
			
			}catch( e ){
				
				//JSON error
				valid = false;
			
			}
			
			//If the config is valid
			if( valid ){
				
				//We are repairing this 
				$scope.repairing = true;
				
				//Loop through each fieldset in our protected array
				angular.forEach( $scope.protected, function( fields, set ){
					
					//Loop through each of the fields in the 
					angular.forEach( fields, function( value, field ){
						
						//If we have a typeof in for this field
						if( typeof config[ set ] !== 'undefined' ){
						
							//If we have a record of this field
							if( typeof config[ set ][ field ] !== 'undefined' ){
								
								//Save the protected variable value
								$scope.protected[ set ][ field ] = config[ set ][ field ].toString();
								
								//Remove it from the config
								config[ set ][ field ] = '';
						
							}
						
						}
						
					});
					
				});



				//For each of the exchanges in the config file
				angular.forEach( config.exchanges, function( fields, exchange ){
					
					//If the exchange hasn't been set yet
					if( $scope.exchanges[ exchange ] == null ) $scope.exchanges[ exchange ] = {};
					
					//Loop through each of the fields
					angular.forEach( fields, function( value, field ){
						
						//Save the exchange field locally
						$scope.exchanges[ exchange ][ field ] = value;
						
						//Omit this field from the config
						config.exchanges[ exchange ][ field ] = '';
						
					});
					
				});
				
				
				
				//Post the clean config to the fixer
				APIService.Fix({ 
					
					//The config we're posting
					config: JSON.stringify( config ),
					
					//The version we're fixing to
					version: $scope.version
					
				//Handler response
				}).then( function( response ){
					
					//Loop through each of the locally stored protected field sets
					angular.forEach( $scope.protected, function( fields, set ){
						
						//Loop through each saved field
						angular.forEach( fields, function( value, field ){
							
							//Loop through each of the field sets valid for this version
							angular.forEach( $scope.fields, function( _fields, _set ){
								
								//Loop through each field
								angular.forEach( _fields, function( _value, _field ){
									
									//If the protected field is a member of this version
									if( _field == field ){
										
										//Add the protected value to the result
										response[ set ][ field ] = value.toString();
							
									}
									
								});
								
							});
			
						});
						
					});
					
					
					//Foreach of the protected exchange values
					angular.forEach( $scope.exchanges, function( fieldset, exchange ){

						//Loop through each field
						angular.forEach( fieldset, function( value, field ){
								
							//Add the protected value
							response.exchanges[ exchange ][ field ] = value;
							
						});
						
					});
					
					
					//Convert the response back into a stringified format
					response = JSON.stringify( response, null, 2 );
					
					//Another little nasty hack
					response = response.replace( /\[\]/g, '{}' );
					
					//Set the config
					$scope.config = response;
					
					//Repairing done.
					$scope.repairing = false;
					
					
				});
				
			}
			
		};
		
		
		//Toggle the about box
		$scope.ToggleHelp = function(){
			
			//Ugh...
			$scope.showHelp = !$scope.showHelp;
			
		}
		
		
		
		
		
	
	
	
		
		
		
		
		//This function attempts to read the JSON formatting of the supplied config ( JSON encoded string )
		//If there are errors with the string, this function will return an array of errors.
		$scope.readJSON = function(){
			
			//Error array
			var _err = [];
			
			//No need to validate nuthin'
			if( $scope.config == '' ) return [];
			
			//Attempt to parse JSON
			try{
				
				var result = JSON_PARSE( $scope.config );
				
			//If we can't
			}catch( exception ){
				
				_err.push({

					message: 'JSON Error: ' + exception.message,
					line: exception.line

				});
			}
			
			return ( _err.length > 0 ? _err : [] );
		
		}
		
		
		
		
		
		
		//This function attempts to read the GUNBOT formatting of the supplied config( JSON encoded string )
		//If there are errors with the Gunbot formatting, this function will return an array of errors
		$scope.readGunbot = function(){
			
			var _err = [];
			
			var valid = false;
			var config = false;
			
			var skip = false;
			
			var found = false;
			var _found = false;
			var __found = false;
			
			var buy_method = false;
			var sell_method = false;
			
			var strategy_name = false;
			
			var use = false;
			
			var found_buy_method = false;
			var found_sell_method = false;
			
			var strategy_fields = false;
			var used_fields = false;
			
			var line = 0;
			
			var buy_method_valid = true;
			var sell_method_valid = true;
			
			var unknown_buy_method = false;
			var unknown_sell_method = false;
			
			//Copy the config into a new variable.
			config = angular.copy( $scope.config );
			
			
			//Parse the JSON config in a TRY
			try{
				
				//Parse
				config = JSON.parse( config );
				
				//Set flag
				valid = true;
			
			}catch( e ){
				
				//JSON error
				valid = false;
			
			}
			
			//If this is valid JSON
			if( valid ){
				
				//Validate main config fields.
				angular.forEach( $scope.fields.main, function( fields, key ){
					
					//Level 1 found pointer
					found = false;
					
					//Loop through supplied config 
					angular.forEach( config, function( _fields, _key ){
						
						//If this fieldset matches our validation template fieldset
						if( key == _key ){
							
							//Set the level 1 found pointer
							found = true;

							//Loop through the required fields for this field set
							angular.forEach( fields, function( __field, __key ){
								
								//Set our level 2 found pointer
								_found = false;
				
								//Loop through the supplied config variables in this fieldset
								angular.forEach( _fields, function( ___field, ___key ){
									
									//If we've matched the field
									if( __field.field == ___key ){
										
										//Set the level 2 found pointer
										_found = true;
										
										//Field has a value that's an object
										if( typeof ___field === 'object' ){
											
											//If we actually have a record of this field being an object 
											if(	typeof __field.children !== 'undefined' ){
												
												//Loop through validation fields for this object
												angular.forEach( __field.children, function( ____field, ____key ){
													
													//Set found level 3 pointer
													__found = false;
													
													//Loop throug each field in the object
													angular.forEach( ___field, function( _____field, _____key ){
														
														//If our fields match up
														if( _____key == ____field.field ){
															
															//Set the level 3 found pointer
															__found = true;
															
														}
														
													});
													
													//If we didn't find the required field for this object
													if( !__found ){
														
														//Push the error.
														_err.push( {
															
															message: 'Missing required field "' + ____field.field + '" in parent "' + __field.field + '" in section "' + key + '"',
															line: JSON_LINE( $scope.config, __field.field, key )
															
														} );
														
													}
													
												});
												
												//Loop through the supplied config variables in this object
												angular.forEach( ___field, function( ____field, ____key ){
													
													//Set the found level 3 pointer
													__found = false;
													
													//Loop through our validation fields
													angular.forEach( __field.children, function( _____field, _____key ){
														
														//If the fields match
														if( _____field.field == ____key ){
															
															//Set the level 3 pointer
															__found = true;
														
														}
														
													});
													
													//If we didn't find this field in our validation template
													if( !__found ){
														
														//Push the error.
														_err.push( {
															
															message: 'Unknown field "' + ____key + '" in parent "' + ___key + '" in section "' + key + '"',
															line: JSON_LINE( $scope.config, ____key, key, ___key )
															
														} );
														
													}
													
												});
											
											}else{
												
												//This variable shouldn't have any children
								
												//Push the error.
												_err.push( {
													
													message: 'Unexpected object "' + ___key + '" in section "' + key + '"',
													line: JSON_LINE( $scope.config, ___key, key )
													
												} );
												
												
											}
											
										//Field has a value that's not an object or array
										}else{
											
											//If the type of this variable doesn't our validation template
											if( typeof ___field !== __field.variable && ___field !== 0 ){
												
												//Push the error.
												_err.push( {
													
													message: 'Unexpected value "' + typeof ___field + '" for field "' + ___key + '" in section "' + key + '" ( requires "' + typeof __field.variable + '" )',
													line: JSON_LINE( $scope.config, ___key, key )
													
												} );
												
											}
											
										}
										
									}
									
								});
								
								//If we haven't found the required field within the supplied config
								if( !_found ){
									
									_err.push( {
										
										message: 'Missing required field "' + __field.field + '" in section "' + key + '"',
										line: JSON_LINE( $scope.config, key )
										
									} );
									
									
									
								}
								
							});
							
							//Loop through each of the config supplied fields
							angular.forEach( _fields, function( __field, __key ){
								
								//Set the found level 1 pointer
								_found = false;
								
								//Loop through each of the known fields for this set
								angular.forEach( fields, function( ___field, ___key ){
									
									//If we've found this field
									if( ___field.field == __key ){
										
										//Set the found level 1 pointer
										_found = true;
								
									}
								
								});
								
								//If the found level 1 pointer hasn't been set
								if( !_found ){
									
									_err.push( {
										
										message: 'Unknown field "' + __key + '" in section "' + key + '"',
										line: JSON_LINE( $scope.config, __key, key )
										
									} );
									
									
									
								}
								
							});
							
						}
					});
					
					//If the found pointer hasn't been set
					if( !found ){
						
						//We're missing an entire field set
						//_err.push( 'Main field set "' + key + '" not found.' );
						
						_err.push( {
							
							message: 'Missing required section "' + key + '"',
							line: 0
							
						} );
						
					}
					
				});
				
				//Validate strategies
				if( typeof config.strategies !== 'undefined' ){
					
					//Loop through each of the supplied strategies
					angular.forEach( config.strategies, function( strategy, alias ){
						
						//Set the buy/sell methods
						buy_method = false;
						buy_method_valid = true;
						
						sell_method = false;
						sell_method_valid = true;
						
						//Set the strategy name variable
						strategy_name = false;
						
						//If we can identify this strategy by the "NAME" field
						if( typeof strategy[ 'NAME' ] !== 'undefined' ){
							
							//Set a variable to fiddle with
							strategy_name = strategy[ 'NAME' ];
							
							//Set the found pointer for the buy method
							found = false;
							
							//Loop through each of the known strategy bases
							angular.forEach( $scope.fields.strategy.bases, function( base ){
								
								//If the buy strategy method matches this base
								if( strategy_name.substr( 0, base.length ) == base ){
									
									//Replace the buy method in the strategy name variable
									strategy_name = strategy_name.substr( ( strategy_name.substr( 0, base.length ).length ) );
									
									//Set the buy method
									buy_method = base;
									
									//Set the found pointer
									found = true;
									
								}
								
							});
							
							//If our buy method was found
							if( found == true ){
							
								//If our strategy name variable is empty, we're using the same method for buying or selling
								if( strategy_name == '' )
								{
									
									//Copy the buy method to the sell method
									sell_method = buy_method;
								
								}else{
									
									//Set the found pointer
									found = false;
									
									//Loop through each of the bases to verify the sell method exists
									angular.forEach( $scope.fields.strategy.bases, function( base ){
										
										//Set the found pointer if this method was found
										if( base == strategy_name ) found = true;
										
									});
									
									//If this method was verified
									if( found ){
										
										//Set the sell method
										sell_method = strategy_name;
										
									}
									
								}
							
							}
							
						//Else, can we identify this strategy by V10 methods?
						}else if( typeof strategy[ 'BUY_METHOD' ] !== 'undefined' && typeof strategy[ 'SELL_METHOD' ] !== 'undefined' ){
							
							//Loop through each of the valid strategy bases
							angular.forEach( $scope.fields.strategy.bases, function( base ){
								
								//If the supplied buy method matches one of the strategy bases, set the buy method
								if( base == strategy[ 'BUY_METHOD' ] ) buy_method = strategy[ 'BUY_METHOD' ];
								
								//If the supplied sell method matches one of the strategy bases, set the sell method
								if( base == strategy[ 'SELL_METHOD' ] ) sell_method = strategy[ 'SELL_METHOD' ];
								
							});
							
							//If we don't have a buy method
							if( !buy_method ) buy_method_valid = false;
							
							//If we don't have a sell method
							if( !sell_method ) sell_method_valid = false;
							
						//We have no way of knowing!!!
						}else{
							
							//Set a variable to fiddle with
							strategy_name = alias;
							
							//Set the found pointer for the buy method
							found = false;
							
							//Loop through each of the known strategy bases
							angular.forEach( $scope.fields.strategy.bases, function( base ){
								
								//If the buy strategy method matches this base
								if( strategy_name.substr( 0, base.length ) == base ){
									
									//Replace the buy method in the strategy name variable
									strategy_name = strategy_name.substr( ( strategy_name.substr( 0, base.length ).length ) );
									
									//Set the buy method
									buy_method = base;
									
									//Set the found pointer
									found = true;
									
								}
								
							});
							
							//If our buy method was found
							if( found == true ){
							
								//If our strategy name variable is empty, we're using the same method for buying or selling
								if( strategy_name == '' )
								{
									
									//Copy the buy method to the sell method
									sell_method = buy_method;
								
								}else{
									
									//Set the found pointer
									found = false;
									
									//Loop through each of the bases to verify the sell method exists
									angular.forEach( $scope.fields.strategy.bases, function( base ){
										
										//Set the found pointer if this method was found
										if( base == strategy_name ) found = true;
										
									});
									
									//If this method was verified
									if( found ){
										
										//Set the sell method
										sell_method = strategy_name;
										
									}
									
								}
							
							}
							
						}
						
						//If we've identified this strategy
						if( buy_method && sell_method ){
							
							//Reset the used fields array
							used_fields = [];
							
							//Loop through strategy validation fields
							angular.forEach( $scope.fields.strategy.fields, function( fields, fieldset ){
								
								//Loop through the fields in this set
								angular.forEach( fields, function( field ){
									
									//Set the use pointer for this field, determining whether we'll use it in validation
									use = false;
								
									//If this is a base strategy field
									if( typeof field.base !== 'undefined' ){
										
										//This is a field from our base methods
										if( ( field.base == buy_method && ( field.type == 'B' || field.type == 'A' ) ) ||
										( field.base == sell_method && ( field.type == 'S' || field.type == 'A' ) ) ){
											
											//Set the use pointer
											use = true;
											
										}
									
									//If this field isn't a member of any bases
									}else{
										
										//Set the use pointer
										use = true;
										
									}
									
									//Set the found pointer for this field
									found = false;
									
									//If we're going to use this field in our validation
									if( use && used_fields.indexOf( field.field ) == -1 )
									{
									
										//Loop through each of the fields in the strategy
										angular.forEach( strategy, function( _value, _field ){
											
											//If the fields match
											if( _field == field.field ){
												
												//Set the found pointer
												found = true;
												
												//If the type of this variable doesn't our validation template
												if( typeof _value !== field.variable && _value !== 0 ){
												
													//We're expecting a different variable here.
													//_err.push( 'Unexpected ' + typeof _value + ' value for strategy "' + alias + '" field "' + _field + '". Expecting ' + field.variable + ' value.' );
													
													_err.push( {
													
														message: 'Unexpected value "' + typeof _value + '" for field "' + _field + '" in strategy "' + alias + '" in section "strategies" ( requires "' + typeof field.variable + '" )',
														line: JSON_LINE( $scope.config, _field, 'strategies', alias )
														
													} );
													
												}
												
											}
											
										});
										
										//We couldn't find a field within our strategy
										if( !found ){
											
											//If this field is allowed to be skipped
											if( typeof field.skip !== 'undefined' ){
												
												//Mauhauhuhauha
											
											//This is a required field, that can't be skipped
											}else{
											
												//If this is a required field
												if( field.required == 'Y' )
												{
													
													//We're missing a required strategy field
													_err.push( {
														
														message: 'Missing required field "' + field.field + '" in strategy "' + alias + '" in section "strategies"',
														line: JSON_LINE( $scope.config, alias, 'strategies' )
														
													} );
													
												//If this is a placeholder field
												}else{
													
													//We're missing a placeholder strategy field
													_err.push( {
														
														message: 'Missing placeholder field "' + field.field + '" in strategy "' + alias + '" in section "strategies"',
														line: JSON_LINE( $scope.config, alias, 'strategies' )
														
													} );
												
													
												}
												
											}
											
										}
										
										//Push this field to the used fields array, so we know not to validate it again
										used_fields.push( field.field );
										
									}
									
								});
								
							});
					
							//Loop through all fields in this strategy
							angular.forEach( strategy, function( _value, _field ){
								
								//Set the found pointer
								found = false;
								
								//Set the skip pointer
								skip = false;
								
								//Loop through each strategy validation field set
								angular.forEach( $scope.fields.strategy.fields, function( fields, fieldset ){
									
									//Loop through each field in the fieldset
									angular.forEach( fields, function( field ){
										
										//Set the use pointer for this field, determining whether we'll use it in validation
										use = false;
									
										//If this is a base strategy field
										if( typeof field.base !== 'undefined' ){
											
											//This is a field from our base methods
											if( ( field.base == buy_method && ( field.type == 'B' || field.type == 'A' ) ) ||
											( field.base == sell_method && ( field.type == 'S' || field.type == 'A' ) ) ){
												
												//Set the use pointer
												use = true;
												
											}
										
										//If this field isn't a member of any bases
										}else{
											
											//Set the use pointer
											use = true;
											
										}
										
										//If we're going to use this field
										if( use ){
											
											//If the fields match
											if( _field == field.field ){
												
												//We've found the field
												found = true;
												
												//Set the skip
												if( typeof field.skip !== 'undefined' ){
													
													skip = true;
													
												}
												
											}
											
										}
										
									});
									
								});
								
								//If this field wasn't found in our required field set
								if( !found ){
									
									//We have an unknown field in this strategy
									_err.push( {
										
										message: 'Unknown field "' + _field + '" in strategy "' + alias + '" in section "strategies"',
										line: JSON_LINE( $scope.config, _field, 'strategies', alias )
										
									} );
									
								//If this field was found
								}
								
							});
							
						//If we're missing a buy or sell method
						}else{
							
							//If the buy method prevented us from finding the strategy
							if( !buy_method_valid ){
								
								_err.push( {
								
									message: 'Unknown BUY_METHOD "' + strategy[ 'BUY_METHOD' ] + '" in strategy "' + alias + '" in section "strategies"',
									line: JSON_LINE( $scope.config, alias, 'strategies' )
									
								} );
								
							}
							
							//If the buy method prevented us from finding the strategy
							if( !sell_method_valid ){
								
								_err.push( {
								
									message: 'Unknown SELL_METHOD "' + strategy[ 'SELL_METHOD' ] + '" in strategy "' + alias + '" in section "strategies"',
									line: JSON_LINE( $scope.config, alias, 'strategies' )
									
								} );
								
							}
							
							if( buy_method_valid && sell_method_valid ){
							
								//We don't know what strategy this is.
								_err.push( {
									
									message: 'Invalid strategy "' + alias + '" in section "strategies"',
									line: JSON_LINE( $scope.config, alias, 'strategies' )
									
								} );
							
							}
							
						
						}
						
						//If we have EMA's set
						if( typeof strategy[ 'EMA1' ] !== 'undefined' && typeof strategy[ 'EMA2' ] !== 'undefined' ){
							
							//If EMA2 is the larger value
							if( strategy[ 'EMA2' ] > strategy[ 'EMA1' ] ){
								
								//We don't know what strategy this is.
								_err.push( {
									
									message: 'Field "EMA2" is a larger value than field "EMA1" in strategy "' + alias + '" in section "strategies"',
									line: JSON_LINE( $scope.config, alias, 'strategies' )
									
								} );
								
							}
							
						}
						
						
					});
					
				//We're missing the strategies field set
				}else{

					_err.push( {
						
						message: 'Missing required section "strategies"',
						line: 0
						
					} );
					
					
				}
				
				//Validate exchanges
				if( typeof config.exchanges !== 'undefined' ){
				
					//Loop through each supplied exchange
					angular.forEach( config.exchanges, function( fields, exchange ){
						
						//Set the found pointer
						found = false;
						
						//Loop through each of the known exchanges
						angular.forEach( $scope.fields.exchange, function( _fields, _exchange ){
							
							//If the exchanges match, set the found pointer
							if( exchange == _exchange ){
								
								//Set the found pointer
								found = true;
								
								//Loop through each of the required fields for this exchange
								angular.forEach( _fields, function( field ){
									
									//Set the level 2 found pointer to false
									_found = false;
									
									//Loop through the fields in this exchange config
									angular.forEach( fields, function( _value, _field ){
										
										//If the fields match up
										if( _field == field.field ){
											
											//Set the level 2 found pointer;
											_found = true;
											
										}
										
									});
									
									//If the required field wasn't found
									if( !_found ){
										
										//We're missing the required exchange field
										//_err.push( 'Missing required field "' + field.field + '" for exchange "' + exchange + '"' );
										
										_err.push( {
														
											message: 'Missing required field "' + field.field + '" in exchange "' + exchange + '" in section "exchanges"',
											line: JSON_LINE( $scope.config, exchange, 'exchanges' )
											
										} );
								
									}
									
								});
								
								//Loop through each of the fields supplied in this exchange
								angular.forEach( fields, function( value, field ){
									
									//Set the level 2 found pointer
									_found = false;
									
									//Loop through each of the required fields for this exchange
									angular.forEach( _fields, function( _field ){
										
										//If the fields match
										if( _field.field == field ){
											
											//Set the level 2 found pointer
											_found = true;
											
										}
										
									});
									
									//If this field wasn't found in our required fields
									if( !_found ){
										
										//There is an unknown field in this exchange field set
										//_err.push( 'Unknown field "' + field + '" in exchange "' + exchange + '"' );
										
										_err.push( {
										
											message: 'Unknown field "' + field + '" in exchange "' + exchange + '" in section "exchanges"',
											line: JSON_LINE( $scope.config, field, 'exchanges', exchange )
											
										} );
										
									}
									
								});
								
							}
							
						});
						
						//If this exhchange wasn't found
						if( !found ){
							
							//We can't identify this exchange
							_err.push( {
								
								message: 'Unknown exchange "' + exchange + '" in section "exchanges"',
								line: JSON_LINE( $scope.config, exchange, 'exchanges' )
								
							} );
							
						}
						
					});
					
				//Couldn't open the exchange object
				}else{
					
					//So it can't exist
					//_err.push( 'No exchange field set detected' );
					
					_err.push( {
							
							message: 'Missing required section "exchanges"',
							line: 0
							
						} );
					
					
				}
				
				//Validate pairs					
				if( typeof config.pairs !== 'undefined' ){
					
					//Loop through each of the pair sets for each exchange
					angular.forEach( config.pairs, function( pairs, exchange ){
						
						//If exchanges have been supplied with this config
						if( typeof config.exchanges !== 'undefined' ){
							
							//Set the found pointer
							found = false;
							
							//Loop through each of the exchanges supplied in the config
							angular.forEach( config.exchanges, function( _fields, _exchange ){
								
								//If we've found the exchange
								if( _exchange == exchange ){
									
									//Set the found pointer
									found = true;
									
									//Loop through each of the pairs supplied for this exchange
									angular.forEach( pairs, function( fields, pair ){
										
										//If a strategy has been assigned to this pair
										if( typeof fields.strategy !== 'undefined' ){
											
											//Set the found pointer
											_found = false;
											
											//Set the strategy fields variable
											strategy_fields = false;
											
											//Loop through each of the strategies supplied in the config
											angular.forEach( config.strategies, function( __fields, strategy ){
												
												//If this strategy has been supplied in the config
												if( fields.strategy == strategy ){
													
													//Set the found pointer
													_found = true;
													
													//Set the strategy fields
													strategy_fields = __fields;
													
												}
												
											});
											
											//If we haven't found this strategy
											if( !_found ){
												
												_err.push( {
													
													message: 'Unknown strategy "' + fields.strategy + '" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs"',
													line: JSON_LINE( $scope.config, 'strategy', 'pairs', exchange, pair )
													
												} );
												
												
											//This pairs strategy was found in the supplied config strategies
											}else{
												
												//If this version supports the "enabled" field on pairs
												if( typeof $scope.fields.pair.enabled !== 'undefined' ){
													
													//If we cannot find the enabled field for this pair
													if( typeof fields.enabled == 'undefined' ){
														
													
														_err.push( {
														
															message: 'Missing required field "enabled" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs"',
															line: JSON_LINE( $scope.config, pair, 'pairs', exchange )
															
														} );
														
														
													//If this field isn't the expected value boolean
													}else if( typeof fields.enabled !== 'boolean' ){
														
												
														_err.push( {
													
															message: 'Unexpected value "' + typeof fields.enabled + '" for field "enabled" in pair "' + pair + '" in exchange "' + exchange + '" in section "pair" ( requires "boolean" )',
															line: JSON_LINE( $scope.config, 'enabled', 'pairs', exchange, pair )
															
														} );
														
													}
												
												}
												
												//If the required "overrides" set is here
												if( typeof fields.override !== 'undefined' ){
													
													//If the overrides field is present, and is an object
													if( typeof fields.override == 'object' ){
														
														//If we can identify this strategy by the "NAME" field
														if( typeof strategy_fields[ 'NAME' ] !== 'undefined' ){
															
															//Set a variable to fiddle with
															strategy_name = strategy_fields[ 'NAME' ];
															
															//Set the found pointer for the buy method
															__found = false;
															
															//Loop through each of the known strategy bases
															angular.forEach( $scope.fields.strategy.bases, function( base ){
																
																//If the buy strategy method matches this base
																if( strategy_name.substr( 0, base.length ) == base ){
																	
																	//Replace the buy method in the strategy name variable
																	strategy_name = strategy_name.substr( ( strategy_name.substr( 0, base.length ).length ) );
																	
																	//Set the buy method
																	buy_method = base;
																	
																	//Set the found pointer
																	__found = true;
																	
																}
																
															});
															
															//If our buy method was found
															if( __found == true ){
															
																//If our strategy name variable is empty, we're using the same method for buying or selling
																if( strategy_name == '' )
																{
																	
																	//Copy the buy method to the sell method
																	sell_method = buy_method;
																
																}else{
																	
																	//Set the found pointer
																	__found = false;
																	
																	//Loop through each of the bases to verify the sell method exists
																	angular.forEach( $scope.fields.strategy.bases, function( base ){
																		
																		//Set the found pointer if this method was found
																		if( base == strategy_name ) __found = true;
																		
																	});
																	
																	//If this method was verified
																	if( __found ){
																		
																		//Set the sell method
																		sell_method = strategy_name;
																		
																	}
																	
																}
															
															}
															
														//Else, can we identify this strategy by V10 methods?
														}else if( typeof strategy_fields[ 'BUY_METHOD' ] !== 'undefined' && typeof strategy_fields[ 'SELL_METHOD' ] !== 'undefined' ){
															
															//Loop through each of the valid strategy bases
															angular.forEach( $scope.fields.strategy.bases, function( base ){
																
																//If the supplied buy method matches one of the strategy bases, set the buy method
																if( base == strategy_fields[ 'BUY_METHOD' ] ) buy_method = strategy_fields[ 'BUY_METHOD' ];
																
																//If the supplied sell method matches one of the strategy bases, set the sell method
																if( base == strategy_fields[ 'SELL_METHOD' ] ) buy_method = strategy_fields[ 'SELL_METHOD' ];
																
															});
															
														//We have no way of knowing!!!
														}
														
														//If there are strategy method overrides in the supplied fieldset
														if( typeof fields.override[ 'BUY_METHOD' ] !== 'undefined' || typeof fields.override[ 'SELL_METHOD' ] !== 'undefined' ){
															
															//Set the found pointers for different methods
															found_buy_method = false;
															found_sell_method = false;
															
															//Loop through each of the valid strategy bases
															angular.forEach( $scope.fields.strategy.bases, function( base ){
																
																//If a buy method has been supplied in this override
																if( typeof fields.override[ 'BUY_METHOD' ] !== 'undefined' ){
																	
																	//If our base matches the supplied buy method
																	if( base == fields.override[ 'BUY_METHOD' ] ){
																		
																		//Set the new buy method for this strategy
																		buy_method = fields.override[ 'BUY_METHOD' ];
																		
																		//Set the found buy pointer;
																		found_buy_method = true;
																		
																	}
																	
																}
																
																//If a sell method has been supplied in this override
																if( typeof fields.override[ 'SELL_METHOD' ] !== 'undefined' ){
																	
																	//If our base matches the supplied sell method
																	if( base == fields.override[ 'SELL_METHOD' ] ){
																		
																		//Set the new sell method for this strategy
																		sell_method = fields.override[ 'SELL_METHOD' ];
																		
																		//Set the found buy pointer;
																		found_sell_method = true;
																		
																	}
																	
																}
																
															});
															
															//If the supplied override buy method was not found
															if( typeof fields.override[ 'BUY_METHOD' ] !== 'undefined' && !found_buy_method ){
																
																//We don't know what this buy method is
																_err.push( {
													
																	message: 'Unexpected value "' + fields.override[ 'BUY_METHOD' ] + '" for override "BUY_METHOD" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs"',
																	line: JSON_LINE( $scope.config, 'BUY_METHOD', 'pairs', exchange, pair, 'override' )
																	
																} );
																
																
															}
															
															//If the supplied override buy method was not found
															if( typeof fields.override[ 'SELL_METHOD' ] !== 'undefined' && !found_sell_method ){
																
																//We don't know what this buy method is
																//We don't know what this buy method is
																_err.push( {
													
																	message: 'Unexpected value "' + fields.override[ 'SELL_METHOD' ] + '" for override "SELL_METHOD" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs"',
																	line: JSON_LINE( $scope.config, 'SELL_METHOD', 'pairs', exchange, pair, 'override' )
																	
																} );
																
															}
															
														}
														
														//If we know both the buy method and sell method for this strategy
														if( buy_method && sell_method ){
															
															//Loop through each of the supplied override fields for this strategy
															angular.forEach( fields.override, function( value, override ){
																
																//Set the level 3 found pointer;
																__found = false;
																
																//Loop through each of the validator template fieldsets
																angular.forEach( $scope.fields.strategy.fields, function( fieldset ){
																	
																	//Loop through each of the fields in this validation fieldset
																	angular.forEach( fieldset, function( _field ){
																		
																		//If the field in the config was found in the validation fields
																		if( _field.field == override ){

																			//If this is a useable base field
																			if( ( typeof _field.base !== 'undefined' && ( ( _field.base == buy_method && _field.type == 'B' ) || ( _field.base == sell_method && _field.type == 'S' ) || ( ( _field.base == buy_method || _field.base == sell_method ) && _field.type == 'A' ) ) ) || typeof _field.base == 'undefined' ){
																			
																				//Set the found pointer;
																				__found = true;
																				
																				//If this override is displaying the wrong value
																				if( typeof value !== _field.variable ){
																					
																					//We haven't got the correct value for this override
																				
																					_err.push( {
													
																						message: 'Unexpected value "' + typeof VALUE + '" for override "' + override + '" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs" ( requires "' + _field.variable + '" )',
																						line: JSON_LINE( $scope.config, override, 'pairs', exchange, pair, 'override' )
																						
																					} );
																					
																				//We have the correct value for this field
																				}
																				
																			}
																	
																		}
																		
																	});
																	
																});
																
																//If the field wasn't found in our validation fieldset
																if( !__found ){
																	
																	//We don't know what this override is. Certainly isn't valid
																
																	_err.push( {
										
																		message: 'Unknown override "' + override + '" in pair "' + pair + '" in exchange "' + exchange + '" section "pairs"',
																		line: JSON_LINE( $scope.config, override, 'pairs', exchange, pair, 'override' )
																		
																	} );
																	
																}
																
															});
														
															
															
														
														//We don't have both the buy and sell methods for this strategy
														}else{
															
														
															_err.push( {
													
																message: 'Unknown strategy override combination in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs"',
																line: JSON_LINE( $scope.config, 'override', 'pairs', exchange, pair )
																
															} );
															
														}
														
													//If our override field is anything but an object
													}else{
														
														_err.push( {
													
															message: 'Unexpected value "' + typeof fields.override + '" for field "overrides" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs" ( requires "object" )',
															line: JSON_LINE( $scope.config, 'override', 'pairs', exchange, pair )
															
														} );
														
														
													}
												
												//We can't find the overrides set
												}else{
													
											
													_err.push( {
														
															message: 'Missing required field "overrides" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs"',
															line: JSON_LINE( $scope.config, pair, 'pairs', exchange )
															
														} );
													
													
												}
												
												
											}
											
										//This pair won't run with no strategy!
										}else{
											
											//We haven't been given a strategy for this pair
											
											_err.push( {
														
												message: 'Missing required field "strategy" in pair "' + pair + '" in exchange "' + exchange + '" in section "pairs"',
												line: JSON_LINE( $scope.config, pair, 'pairs', exchange )
												
											} );
											
										}
										
									});
									
								}
								
							});
							
							//If the exchange was not found
							if( !found ){
								
								//We can't verify any pairs for an exchange that wasn't found
								_err.push( {
								
									message: 'Exchange "' + exchange + '" in pair "' + pair + '" section "pairs" was not found in section "exchanges"',
									line: JSON_LINE( $scope.config, exchange, 'pairs' )
									
								} );
								
							}
							
						//Cannot verify pairs against exchanges
						}else{
						
							//This exchange wasn't found in the exchanges section
							_err.push( {
								
								message: 'Unknown exchange "' + exchange + '" in section "pairs"',
								line: JSON_LINE( $scope.config, exchange, 'pairs' )
								
							} );
						
						}
						
					});
					
				//Could not open the pairs array
				}else{
					
					//Missing the pairs field set
					_err.push( {
							
							message: 'Missing required section "pairs"',
							line: 0
							
						} );
					
				}
			
			}
			
			return( _err.length > 0 ? _err : [] );
			
		}
		
		
		
    }
	

	
	
	
	
})();