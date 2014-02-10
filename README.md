#CAStore Javascript starter kit

SDK wrapping API Authentication through OAuth.


## Requirements
* node.js
* phonegap
* a domain set to your localhost (dev only) in the provided example, localhost.fr points to localhost.


##Development
There are some specifics to developping your phonegap application on a browser:

###AJAX 

As for now, the API does not reply correctly to OPTIONS requests, blocking AJAX calls in development.
A very simplistic proxy server is provided with the starter kit to address that issue.

###Authentication iframe cookies 
Initializing the starter kit without a saved session will force a new authentication procedure, refreshing the request token and access token.

The authentication iframe, however, has its request token set via cookies, and will then **not** match the new request token.

Until a session save system is set in your application, you will need to delete cookies from www.creditagricolestore.fr before relaunching the application in your browser. 

###Callback URL
When testing in your browser, the callback URL's domain and your application domain should match, for the url redirection parameters to be properly read.
When running on device, the callback URL should not redirect.
Note that launching your application from the filesystem will give it a null domain, which won't match any other domain.

## Proxy and content server
The started kit comes with a proxy and a static webserver.

The proxy options server will answer directly to all OPTIONS requests, and proxy all others to the standard CAStore API. It is set to listen on port 8080.

**The proxy options server is NOT actually configured to know what methods are allowed on the server routes and will always reply with GET,POST,PUT,DELETE**

The static webserver is simply serving static files contained under the /www directory. It is set to listen on port 8081.

###Installing the servers

    cd server
    npm install
	
###Running the servers
    node app.js

## Connecting to the CAStore API

###Callbacks
Callback functions provided to the CAStore API will be called with a node.js-like scheme, with the first argument being the eventual error:

    function someCallback(err, data){
        if (err){
            /* Handle error */
		}
		else {
			/* Handle data */
		}
    }

###Initializing the SDK

**Creating a new CAStore instance:**

    var caStore = new CAStore(
        CONSUMER_KEY,
        CONSUMER_SECRET,
        'http://localhost.fr:8081/callback_url.html'/* Callback url */,
        'http://localhost.fr:8080/' /* Proxy server address */);

The proxy server can be ommited for production or when running on phonegap.


**Initialization without a saved session:**

    caStore.init(
        loginContainer[0] /* Container for authentication iframe */, 	
        onCAStoreInitialized);


**(alternatively) Initializing with a saved session:**

    var session = ... /* load session from localStorage, cookie, etc*/
    caStore.import(savedSession);

onCaStoreInitialized will be called back once the authentication procedure is complete.
An example with LocalStorage session saving/loading can be found in js/demo/demo.js


**exporting a session after initialization:**

    var session = caStore.export();



###Querying the API
Queries https://www.creditagricolestore.fr/castore-data-provider/rest/V1/utilisateurs/user_id/comptesBAM

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

