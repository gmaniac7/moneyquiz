module.exports = {

	// IP address to bind the server
	"bind": "127.0.0.1",

	// The port to listen on
	"port": 8080,

	// Path of public directory for static
	// conent
	"static": false,

	// Wether it is an http or https server
	"ssl": false,

	// If https provide ssl info
	"sslCert": {

		// Leave undefined if not applicable
		"ca": false,

		// Required
		"key": false,
		"cert": false

	},

	// Websocket support
	"ws": false,

	// Server header with ZenX version
	"serverHeader": true,

	// Security
	// ----------------------

	// Set global hard upload limit
	"uploadLimit": "5mb"

};
