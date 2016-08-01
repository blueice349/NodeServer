'use strict';

var http = require( 'http' );

var port = 8080;


var sanitizeHeaderValue = function ( string ) {

	var returns;

	if ( string !== undefined ) {
		returns = String( string ).replace( /\n/g, '' ).replace( /=/g, '\\=' );
	}

	return returns;
};

http.IncomingMessage.prototype.getCookies = function () {

	var list = {};
	var rc   = this.headers.cookie;

	rc && rc.split( ';' ).forEach( function ( cookie ) {

		var parts = cookie.split( '=' );

		list[ parts.shift().trim() ] = decodeURI( parts.join( '=' ) );
	} );

	return list;
};

http.ServerResponse.prototype.deleteCookie = function ( key ) {

	var key     = sanitizeHeaderValue( key );
	var expires = new Date().toUTCString();

	this.setHeader( 'Set-Cookie', [ key + '=; expires=' + expires ] );
};

http.ServerResponse.prototype.setCookie = function ( key, value, expires ) {

	key = sanitizeHeaderValue( key );

	if ( key ) {
		value = sanitizeHeaderValue( value ) || '';

		if ( typeof expires === 'number'
		&&   isFinite( expires ) ) {

			expires = new Date( new Date().getTime() + expires ).toUTCString();

		} else {
			expires = '';
		}

		this.setHeader( 'Set-Cookie', [ key + '=' + value + '; expires=' + expires ] );

	} else {
		throw new Error( 'ServerResponse.setCookie: key was invalid: ' + key );
	}
};

http.IncomingMessage.prototype.getPath = function () {

	var index;

	if ( this.url.indexOf( '?' ) > -1 ) {
		index = this.url.indexOf( '?' );

	} else {
		index = this.url.length;
	}

	var url  = this.url.slice( 0, index ).replace( '/', '' ).replace( /\/$/, '' );
	var path = url ? url.split( '/' ) : [];

	return path;
};

http.IncomingMessage.prototype.getArguments = function () {

	var args = {};

	var rawArgs = this.url.slice( this.url.indexOf( '?' ) + 1 || this.url.length, this.url.length ).split( '&' );

	for ( var i in rawArgs ) {
		var arg = rawArgs[ i ].split( '=' );

		args[ arg[ 0 ] ] = arg[ 1 ];
	}

	return args;
};

http.IncomingMessage.prototype.getMethod = function () {

	return this.method;
};

var handleRequest = function ( request, response ) {

	var path    = request.getPath();
	var args    = request.getArguments();
	var cookies = request.getCookies();

	console.log( 'path: ' + path );
	console.log( args );
	console.log( cookies );
	console.log( request.getMethod() );

	if ( cookies.test !== undefined ) {
		console.log( 'Cookie exists! Deleting it!' );
		response.deleteCookie( 'test' );

	} else {
		var val = Math.random();
		console.log( 'Cookie wasnt there, Adding it: ' + val );
		response.setCookie( 'test', val );
	}

	response.end(
		'PATH:    ' + JSON.stringify( path ) + '\n' +
		'ARGS:    ' + JSON.stringify( args ) + '\n' +
		'Cookies: ' + JSON.stringify( cookies )
	);
};

http.createServer( handleRequest ).listen( port, function () {

	console.log( 'Server loaded, listening on port: ' + port );
} );
