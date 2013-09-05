ec2-openvpn
===========

Simple node script to spin up an EC2 instance, configure OpenVPN, and retrieve the client credentials.

Requirements
============
* An EC2 account of your very own
* An EC2 image of an OpenVPN install (script expects Access Server 1.8.4; details outside the scope of this project)
* NodeJS 0.10.x (I have it installed via the official package; YMMV)
* PhantomJS 1.9.x (I have it installed via homebrew; YMMV)
* CasperJS 1.0.x (I have it installed via homebrew; YMMV)
* Various npm modules (see package.json)
* A lil' config file (default location is '~/.robot.aws'):

    {
      "key": "[Your EC2 key]"
    , "secret": "[Your EC2 secret]"
    , "endpoint": "[EC2 endpoint] Example: us-east-1"
    , "imageId": "[EC2 image to start] Example: ami-abcdef01"
    , "keyName": "[EC2 keyset to use]"
    , "securityGroup": "[EC2 security group to use]"
    , "openvpnUser": "[username of OpenVPN instance]"
    , "openvpnPass": "[password of OpenVPN instance]"
    }

How do I use this thing?
========================
1. Set up the config file. The default location is '~/.robot.aws'. It's just a bit of JSON - see above.
2. npm install
3. node app.js
4. Import the downloaded .ovpn file in your OpenVPN client of choice (Tunnelblick is my current favorite.)

TODO
====
* I want to switch this over to Spooky so it doesn't have to call Casper directly.
* I have notes on how to set up the OpenVPN instance. Might blog/publish/whatever them someday.
* One might scoff at all those credentials lying out on your disk.

Anything else?
==============
MIT license, do whatever you want, pull requests welcome, no warranties expressed or implied, have fun.