var CAStore = (function(){

    var SERVER_BASE_URL = 'https://www.creditagricolestore.fr/';
    var USERS_BASE_ROUTE = 'castore-data-provider/rest/V1/utilisateurs/';

    function CAStore(consumerKey, consumerSecret, callbackURL, proxy){
        this.consumer = {
            key: consumerKey,
            secret: consumerSecret
        };
        this.proxy = proxy;
        this.callbackURL = callbackURL;

        this.oauth = {
            key: null,
            secret: null,
            verifier: null
        };

        this.request = {
            token: null,
            secret: null,
            verifier: null
        };

        this.session = {
            userId: null,
            get baseUserURL(){
                return USERS_BASE_ROUTE + this.userId + '/';
            },
            GET: this.GETWithSession.bind(this),
            POST: this.POSTWithSession.bind(this),
            PUT: this.PUTWithSession.bind(this),
            DELETE: this.DELETEWithSession.bind(this)
        };
    }

    CAStore.prototype = {
        callbackURL: null,
        consumer: null,
        oauth: null,
        proxy: null,
        request: null,
        session: null,
        DOMElement: null
    };

    /* -------------------------------------------- Initialization -------------------------------------------- */

    CAStore.prototype.init = function(DOMElement, callback){

        if (!DOMElement)
            throw new Error('Target DOM Element must be set');
        this.DOMElement = DOMElement;
        this._getRequestToken(onRequestTokenObtained);

        function onRequestTokenObtained(err, self){
            if (err)
                return (callback)? callback(err) : null;
            return self._createAuthIframe(onAuthenticationObtained);
        }

        function onAuthenticationObtained(err, self){
            if (err)
                return (callback)? callback(err) : null;
            return self._getAccessToken(onAccessTokenObtained);
        }

        function onAccessTokenObtained(err, self){
            if (err)
                return (callback)? callback(err) : null;
            return self._getSession(onSessionObtained);
        }

        function onSessionObtained(err, self){
            return (callback)? callback(err, self) : null;
        }
    };

    CAStore.prototype.import = function(toImport, callback){
        this.oauth = toImport.oauth;
        this.request = toImport.request;
        this.session.userId = null;

        this._getSession(callback);
    };

    CAStore.prototype.export = function(){
        return {
            oauth: this.oauth,
            request: this.request
        };
    };

    CAStore.prototype._getRequestToken = function(callback){
        var self = this;
        var descriptor =  this.createDescriptor('POST',
            'castore-oauth/resources/1/oauth/get_request_token',
            { oauth_callback: this.callbackURL });
        this.sendRequest(this.createRequest(descriptor), null, onRequestTokenObtained);

        function onRequestTokenObtained(err, response){
            if (err)
                return (callback)? callback(err) : null;

            response = responseStringToMap(response.response);
            self.request.token = response.oauth_token;
            self.request.secret = response.oauth_token_secret;
            if (callback)
                callback(null, self);
        }
    };

    CAStore.prototype._createAuthIframe = function(callback){
        var self = this;
        var iframe = document.createElement('iframe');
        iframe.setAttribute('src', 'https://www.creditagricolestore.fr/castore-data-provider/authentification/?0&oauth_token=' + this.request.token);
        iframe.addEventListener('load', onIframeLoaded);
        this.DOMElement.appendChild(iframe);

        function onIframeLoaded(){
            var url;
            try {
                url = iframe.contentWindow.location.href;
            }
            catch(exception){

            }
            if (!url || url.indexOf(self.callbackURL) < 0)
                return;

            var response = responseStringToMap(url);

            //TODO: check if token hasn't changed
            self.request.verifier = response.oauth_verifier;
            if (callback)
                callback(null, self);
        }
    };

    CAStore.prototype._getAccessToken = function(callback){
        var self = this;
        var descriptor =  this.createDescriptor('POST', 'castore-oauth/resources/1/oauth/get_access_token');
        this.sendRequest(this.createRequest(descriptor), null, onAccessTokenObtained);

        function onAccessTokenObtained(err, response){
            if (err)
                return (callback)? callback(err) : null;
            response = responseStringToMap(response.response);
            self.oauth.token = response.oauth_token;
            self.oauth.secret = response.oauth_token_secret;
            if (callback)
                callback(null, self);
        }
    };

    CAStore.prototype._getSession = function(callback){
        var self = this;
        var descriptor =  this.createDescriptor('GET', 'castore-data-provider/rest/V1/session');
        var request = this.createRequest(descriptor, {Accept: 'application/json'});
        this.sendRequest(request, null, onSessionObtained);

        function onSessionObtained(err, response){
            if (err)
                return error(err);
            if (!response || !response.response)
                return error('Error getting session');
            response = parseResponseToJSON(response);
            if (!response || !response.data || !response.data.id)
                return error('Error getting session');
            self.session.userId = response.data.id;
            if (callback)
                callback(null, self);

            function error(err){
                return (callback)? callback(err) : null;
            }
        }
    };

    function responseStringToMap(response){
        return response.replace(/.*\?/, '')
            .split('&')
            .reduce(addKeyValue, {});

        function addKeyValue(result, keyValueString){
            var split = keyValueString.split('=');
            if (split && split.length == 2)
                result[split[0]] = split[1];
            return result;
        }
    }

    /* ------------------------------------------------ Shorthands ------------------------------------------------ */

    CAStore.prototype.GET = function(route, callback){
        return this.queryJSON('GET', route, null, null, callback);
    };

    CAStore.prototype.POST = function(route, payload, callback){
        return this.queryJSON('POST', route, null, payload, callback);
    };

    CAStore.prototype.PUT = function(route, payload, callback){
        return this.queryJSON('PUT', route, null, payload, callback);
    };

    CAStore.prototype.DELETE = function(route, callback){
        return this.queryJSON('DELETE', route, null, null, callback);
    };

    CAStore.prototype.GETWithSession = function(route, callback){
        return this.GET(this.session.baseUserURL + route, callback);
    };

    CAStore.prototype.POSTWithSession = function(route, payload, callback){
        return this.POST(this.session.baseUserURL + route, payload, callback);
    };

    CAStore.prototype.PUTWithSession = function(route, payload, callback){
        return this.PUT(this.session.baseUserURL + route, payload, callback);
    };

    CAStore.prototype.DELETEWithSession = function(route, callback){
        return this.DELETE(this.session.baseUserURL + route, callback);
    };

    CAStore.prototype.queryJSON = function(method, route, headers, payload, callback){
        return this.query(method, route, {Accept: 'application/json'}, payload, parseResponse);

        function parseResponse(err, response){
            if (err)
                return (callback)? callback(err) : null;
            return (callback)? callback(null, parseResponseToJSON(response)) : null;
        }
    };

    function parseResponseToJSON(response){
        var data = response.response;
        try {
            data = JSON.parse(data);
        }
        catch(error){}

        return {
            request: response,
            status: response.status,
            data: data
        };
    }

    CAStore.prototype.query = function(method, route, headers, payload, callback){
        var descriptor = this.createDescriptor(method, route);
        var request = this.createRequest(descriptor, headers);
        return this.sendRequest(request, payload, callback);
    };

    /* ----------------------------------------- OAuth headers injection ----------------------------------------- */

    CAStore.prototype.createDescriptor = function(method, route, parameters){
        var descriptor = {
            method: method,
            action: SERVER_BASE_URL + route,
            url: (this.proxy)? this.proxy + route : SERVER_BASE_URL + route,
            parameters: {
                oauth_consumer_key: this.consumer.key,
                oauth_token: this.oauth.token || this.request.token,
                oauth_verifier: this.request.verifier
            }
        };

        if (parameters)
            Object.getOwnPropertyNames(parameters)
                .reduce(addParameter, descriptor.parameters);

        OAuth.completeRequest(descriptor, {consumerSecret: this.consumer.secret, tokenSecret: this.oauth.secret || this.request.secret});
        return descriptor;

        function addParameter(result, parameterName){
            result[parameterName] = parameters[parameterName];
            return result;
        }
    };

    CAStore.prototype.createRequest = function(descriptor, headers){
        headers = headers || {};
        var request = new XMLHttpRequest();
        request.open(descriptor.method, descriptor.url);
        if (descriptor.method != 'GET')
            request.setRequestHeader('Content-Type', headers['Content-Type'] || 'application/x-www-form-urlencoded');
        request.setRequestHeader('Accept', headers['Accept'] || 'application/x-www-form-urlencoded');
        request.setRequestHeader('Authorization', getAuthorizationHeader(descriptor.parameters));
        return request;
    };

    CAStore.prototype.sendRequest = function(request, payload, callback){
        request.onload = onRequestResponse;
        if (payload)
            request.setRequestHeader("Content-length", payload.length);
        request.send(payload);

        function onRequestResponse(event){
            if (event.currentTarget.status >= 400)
                return (callback)? callback(event.currentTarget) : null;
            if (callback)
                callback(null, event.currentTarget);
        }
    };

    function getAuthorizationHeader(parameters){
        return OAuth.getParameterList(parameters)
            .sort(compareName)
            .reduce(encodeParameters, 'OAuth ');

        function compareName(a, b){
            if (a[0] == b[0])
                return 0;
            return (a[0] > b[0])? 1 : -1;
        }

        function encodeParameters(header, parameter, index){
            var name = parameter[0];
            var value = parameter[1];
            return header + ((index)? ', ' : '') + OAuth.percentEncode(name) + '=' + '"' + OAuth.percentEncode(value) + '"';
        }
    }

    return CAStore;

}());

