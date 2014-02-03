#CAStore Javascript starter kit

SDK wrapping API Authentication through OAuth.

As for now, the API does not reply correctly to OPTIONS requests, blocking AJAX calls in development.
A very simplistic proxy server is provided with the starter kit to address that issue.

## Requirements
* node.js
* a domain set to your localhost (dev only) in the provided example, localhost.fr points to localhost.

## Proxy and content server
The started kit comes with a proxy and a static webserver.

The proxy options server will answer directly to all OPTIONS requests, and proxy all others to the standard CAStore API. It is set to listen on port 8080.

**The proxy options server is NOT actually configured to know what methods are allow on the server routes and will always reply with GET,POST,PUT,DELETE**

The static webserver is simply serving static files contained under the /client directory. It is set to listen on port 8081.

###Installing the servers

    cd server
    npm install
	
###Running the servers
    node app.js

## Connecting to the CAStore API


###Initializing the SDK
    var caStore = new CAStore(
        CONSUMER_KEY,
        CONSUMER_SECRET,
        'http://localhost.fr:8081/callback_url.html'/* Callback url */,
        'http://localhost.fr:8080/' /* Proxy server address */);

    caStore.init(
        loginContainer[0] /* Container for authentication iframe */, 	
        onCAStoreInitialized);

onCaStoreInitialized will be called back once the authentication procedure is complete.
The proxy server can be ommited for production or when running on phonegap.

###Querying the API
Queries https://www.creditagricolestore.fr/castore-data-provider/rest/V1/utilisateurs/<user_id>/comptesBAM

    caStore.session.GET('comptesBAM', function(err, response){
        console.log('BAM:', response.data)
    });

REST queries can be made through:

* caStore.GET(route, callback)
* caStore.POST(route, payload, callback)
* caStore.PUT(route, payload, callback)
* caStore.DELETE(route, callback)

The user id is stored under caStore.session.userId

###Shorthand REST queries

* caStore.session.GET(route, callback)
* ...

Those methods will prepend the base user route and the user id to the request.
