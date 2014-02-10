$(function(){

    var CONSUMER_KEY = 'https://www.creditagricolestore.fr/castore-oauth/resources/1/oauth/consumer/cfa96c7a03e34bd2974d3c6579ed2391';
    var CONSUMER_SECRET = 'b1049093d2664041b2dc7e81e63208dc';

    var loginContainer = $('#login_container');
    loginContainer.show();

    var CALLBACK_URL;
    var PROXY_URL;

    //Test - Disabling proxy on device.
    if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
        CALLBACK_URL = 'http://www.julien-sarazin.com/#/';
    }
    else {
        CALLBACK_URL = 'http://localhost.fr:8081/callback_url.html';
        PROXY_URL = 'http://localhost.fr:8080/';
    }

    var caStore = new CAStore(CONSUMER_KEY,
        CONSUMER_SECRET,
        CALLBACK_URL,
        PROXY_URL);

    caStore.logger = {
        log: function(args){
            $('#debug')
                .append(parse(arguments)
                    .reduce(appendParagraph, $('<li>')));

            function parse(args){
                if (!args || !args.length)
                    return '';
                return Array.prototype.map.call(args, argToString);

                function argToString(arg){
                    return (!arg || arg instanceof Object)? JSON.stringify(arg) : arg.toString();
                }
            }

            function appendParagraph(container, content, index){
                return container
                    .append(((!index)? $('<h4>') : $('<p>'))
                        .append(content));
            }
        }
    };

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
            loginContainer
                .empty()
                .hide();
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
            caStore.session.BAMId = account.id;
            getEmitterAccounts();
            getTargetAccounts();
        }
    }
    var emitterAccounts = null;
    var receiverAccounts = null;

    function getEmitterAccounts(){
        caStore.session.GET('comptesBAM/' + caStore.session.BAMId + '/comptesEmetteurs', onEmitterAccountsObtained);

        function onEmitterAccountsObtained(err, response){
            emitterAccounts = response.data.compteEmetteurDTOs;
            if (emitterAccounts && receiverAccounts)
                getTransferIFrame();
        }
    }

    function getTargetAccounts(){
        caStore.session.GET('comptesBAM/' + caStore.session.BAMId + '/comptesBeneficiaires', onTargetAccountsObtained);

        function onTargetAccountsObtained(err, response){
            receiverAccounts = response.data.compteBeneficiaireDTOs;
            if (emitterAccounts && receiverAccounts)
                getTransferIFrame();
        }
    }

    function getTransferIFrame(){
        loginContainer.show();
        caStore.getTransferIFrame({
            BAMId: caStore.session.BAMId,
            emitterId: emitterAccounts[0].id,
            receiverId: receiverAccounts[1].id,
            title: 'Test transfer - ' + new Date().toLocaleString(),
            amount: 42
        },
        loginContainer[0],
        function(err, iframe){
            console.log('Transfer iframe:', iframe);
        });
    }
});