$(function(){

    var CONSUMER_KEY = 'https://www.creditagricolestore.fr/castore-oauth/resources/1/oauth/consumer/cfa96c7a03e34bd2974d3c6579ed2391';
    var CONSUMER_SECRET = 'b1049093d2664041b2dc7e81e63208dc';

    var loginContainer = $('#login_container');
    loginContainer.show();

    var caStore = new CAStore(CONSUMER_KEY,
        CONSUMER_SECRET,
        'http://localhost.fr:8081/callback_url.html',
        'http://localhost.fr:8080/');

    caStore.init(loginContainer[0], onCAStoreInitialized);

    function onCAStoreInitialized(err, caStore){
        if (err)
            return console.log('Error', err);
        loginContainer.hide();
        caStore.session.GET('comptesBAM', onBAMObtained);
    }

    function onBAMObtained(err, response){
        var account = response.data.compteBAMDTOs[0];
        alert('BAM!\nId:' + account.id + '\nAlias: ' + account.alias);
    }
});