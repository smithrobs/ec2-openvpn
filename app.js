var ec2 = require("ec2")
    , fs = require("fs")
    , path = require("path")
    , phantom = require("phantom")
    ;

var instance = startUpOpenVpnInstance();

// test spooky
//configureOpenVpn({ dnsName: "ec2-1.1.1.1.compute-1.amazonaws.com", ipAddress: "1.1.1.1"});

// Run an instance and return its details.
function startUpOpenVpnInstance() {
    var configurationFile = path.resolve(process.env.HOME, ".robot.aws")
    var configuration = JSON.parse(fs.readFileSync(configurationFile, "utf8"));
    ec2 = ec2(configuration);

    ec2("RunInstances", {
        ImageId: configuration.imageId, KeyName: configuration.keyName, "SecurityGroupId.0": configuration.securityGroup,
        InstanceType: "t1.micro", MinCount: 1, MaxCount: 1
    }, running);

    var reservationId, instanceId;

    function running(error, response) {
        if (error) throw error;
        reservationId = response.reservationId;
        instanceId = response.instancesSet[0].instanceId;
        describe();
    }

    function describe() {
        ec2("DescribeInstances", {}, starting);
    }

    function starting(error, response) {
        if (error) throw error;
        var reservation, instance;
        reservation = response.reservationSet.filter(function (reservation) {
            return reservation.reservationId == reservationId;
        })[0];
        instance = reservation.instancesSet.filter(function (instance) {
            return instance.instanceId == instanceId;
        })[0];

        if (instance.instanceState.name == "running") ready(instance);
        else setTimeout(describe, 2500);
    }

    function ready(instance) {
        console.log("Instance created with id: " + instanceId);
        console.log(instance.dnsName + " [" + instance.ipAddress + "]");

        //spawn casper process as haven't switched over to spooky yet
        var spawn = require('child_process').spawn;
        spawn('casperjs',
            ['--ignore-ssl-errors=yes', 'casper.js', instance.dnsName, instance.ipAddress, configuration.openvpnUser, configuration.openvpnPass ],
            { stdio: 'inherit' });

        //configureOpenVpn(instance);
    }
}

function configureOpenVpn(instance) {
    var adminUrl = "https://" + instance.dnsName + ":943/admin/";
    var loginUrl = "https://" + instance.dnsName + "/";

    try {
        var Spooky = require('spooky');
    } catch (e) {
        var Spooky = require('../lib/spooky');
    }
    try {

        var spooky = new Spooky({
            child: {
                'web-security': 'no',
                'ignore-ssl-errors': 'yes'
            },
            casper: {
                logLevel: 'debug',
                verbose: true
            }
        }, function (err) {
            if (err) {
                e = new Error('Failed to initialize SpookyJS');
                e.details = err;
                throw e;
            }

            spooky.on('error', function (e) {
                console.error(e);
            });

            // Uncomment this block to see all of the things Casper has to say.
            // There are a lot.
            // He has opinions.
            spooky.on('console', function (line) {
                console.log(line);
            });

            spooky.on('log', function (log) {
                if (log.space === 'remote') {
                    console.log(log.message.replace(/ \- .*/, ''));
                }
            });

            console.log("Contacting " + adminUrl);
            spooky.start(adminUrl);
            spooky.thenEvaluate(function () {
                console.log(':::')
                console.log('Hello, from', document.title);
            });
            spooky.run();
        });
    } catch (e) {
        console.log(e);
    }
}