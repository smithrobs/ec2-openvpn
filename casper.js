// casperjs --ignore-ssl-errors=yes casper.js ec2-1.1.1.1.compute-1.amazonaws.com 1.1.1.1 username password
var fs = require('fs');
var casper = require('casper').create({
    pageSettings: {
        loadImages:  false
    },
    verbose: true,
    logLevel: "debug",
    timeout: 45000,
    stepTimeout: 45000,
    waitTimeout: 45000
});

var dnsName = casper.cli.get(0);
var ipAddr = casper.cli.get(1);
var userName = casper.cli.get(2);
var passWord = casper.cli.get(3);

casper.onError = function(e)
{
    console.error(e);
}
casper.onLoadError = function(e)
{
    console.error(e);
}

////////

// retries with open is not something casperjs wants to implement
// ref: https://github.com/n1k0/casperjs/issues/311
casper.tryOpen = function(url, then) {
    return this.then(function() {
        this.open(url);
        this.waitFor(function testStatus() {
            return this.status().currentHTTPStatus === 200;
        }, then, function onFail() {
            console.log('failed, retrying');
            this.tryOpen(url);
        }, 2000);
    });
};

casper.start();
casper.tryOpen('https://' + dnsName + ':943/admin/', function() {
    this.echo('site is up... configuring...')
});
casper.waitForResource('login.css', function() {
    this.fill('form', {
        'username': userName,
        'password': passWord
    }, true);
});
casper.then(function() {
    this.evaluateOrDie(function()
    {
        return (document.title === 'OpenVPN Access Server Status Overview');
    }, 'login failed');
});
casper.thenOpen('https://' + dnsName + ':943/admin/server_network_settings', function() {
    this.evaluateOrDie(function()
    {
        return (document.title === 'OpenVPN Access Server Server Network Settings');
    }, 'nav to network settings failed');

    this.fill('form', {
        'host.name': ipAddr
    });
});
casper.thenClick('input.btTxt', function() {
    this.echo('clicked');
});
casper.thenClick('div#changesDiv input.btTxt', function() {
    this.echo('clickedToo');
});

// now we need to logon as a user and download the config

casper.thenOpen('https://' + dnsName + ':943/', function() {
    this.evaluateOrDie(function()
    {
        return (document.title === 'OpenVPN Connect');
    }, 'nav to login failed');
});
casper.waitForSelector('input#username.normal', function() {
    this.evaluate(function(username, password) {
        document.querySelector('#username').value = username;
        document.querySelector('#password').value = password;
        document.querySelector('select#action').value = 'downloads';
    }, userName, passWord);
});
casper.thenClick('button#go', function() {
    this.echo('clicked');
});
casper.waitForSelector('ul#profiles a:last-child', function() {
    var dlLocation = this.getElementAttribute('ul#profiles a[href^="config"]', 'href');

    this.download(dlLocation, 'client.ovpn');
    fs.makeDirectory('./client');
    fs.move('./client.ovpn', './client/client.ovpn');
});

// TODO: need to get tunnelblick to import the config

casper.run(function() {
    this.echo('openvpn instance configured').exit();
});
