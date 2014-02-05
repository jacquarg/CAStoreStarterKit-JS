$(function(){

    var CONSUMER_KEY = 'https://www.creditagricolestore.fr/castore-oauth/resources/1/oauth/consumer/cfa96c7a03e34bd2974d3c6579ed2391';
    var CONSUMER_SECRET = 'b1049093d2664041b2dc7e81e63208dc';

    var loginContainer = $('#login_container');
    loginContainer.show();

    var caStore = new CAStore(CONSUMER_KEY,
        CONSUMER_SECRET,
        'http://localhost.fr:8081/callback_url.html',
        'http://localhost.fr:8080/');

    var sessionStore = (function(){
        var LOCALSTORAGE_SESSION_KEY = 'savedSession';
        return {
            load: function(){
                try {
                    return JSON.parse(localStorage.getItem(LOCALSTORAGE_SESSION_KEY));
                }
                catch(error){
                    return null;
                }
            },

            save: function(session){
                localStorage.setItem(LOCALSTORAGE_SESSION_KEY, JSON.stringify(session));
            },

            clear: function(){
                localStorage.removeItem(LOCALSTORAGE_SESSION_KEY);
            }
        }
    }());

    (function initialize(){
        var session = sessionStore.load();
        if (session)
            initializeCAStoreWithSession(session);
        else
            initializeCAStore();
    }());

    function initializeCAStoreWithSession(session){
        caStore.import(session, onImportComplete);

        function onImportComplete(err, caStore){
            if (!err)
                return getBAM();
            sessionStore.clear();
            initializeCAStore();
        }
    }

    function initializeCAStore(){
        caStore.init(loginContainer[0], onCAStoreInitialized);

        function onCAStoreInitialized(err, caStore){
            loginContainer.hide();
            if (err)
                return console.log('Error initializing CAStore', err);
            sessionStore.save(caStore.export());
            getBAM();
        }
    }

    function getBAM(){
        caStore.session.GET('comptesBAM', onBAMObtained);

        function onBAMObtained(err, response){
            var account = response.data.compteBAMDTOs[0];
            alert('BAM!\nId:' + account.id + '\nAlias: ' + account.alias);
        }
    }
});