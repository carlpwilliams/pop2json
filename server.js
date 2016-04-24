var express = require('express');
var POP3Client = require("poplib");
var MailParser = require("mailparser").MailParser;
var app = express();
var mailparser = new MailParser();
var bodyParser = require('body-parser');

var server = app.listen();
server.timeout = 100000;
// create application/json parser
var jsonParser = bodyParser.json({ limit: '200mb' });

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// front end routes
app.post('/', jsonParser, function (req, res) {
    console.info(req.body);
    getEmail(res, req.body.username, req.body.password, req.body.host, req.body.port);
}); // end of get

function getEmail(res, username, password, host, port) {
    var client = {};
    var currentMessageId = 1;
    var retVal = { "gotEmails": false, "totalMessages": 0, "errors": [], "mailObjects": [] };
    client = new POP3Client(port, host, {
        tlserrs: false,
        enabletls: false,
        debug: false
    });

    client.on("error", function (err) {
        if (err.errno === 111) handleError(retVal, "Unable to connect to server");
        else handleError(retVal, "Server error occurred");
        finish(res, retVal);
    });

    client.on("invalid-state", function (cmd) {
        handleError(retval, "Invalid state. You tried calling " + cmd);
    });

    client.on("connect", function () {
        client.login(username, password);
    });

    client.on("login", function (status, rawdata) {
        if (status) {
            client.list();
        } else {
            handleError(retVal, "LOGIN/PASS failed");
            client.quit();
            finish(res, retVal);
        }
    });

    // Data is a 1-based index of messages, if there are any messages
    client.on("list", function (status, msgcount, msgnumber, data, rawdata) {
        retVal.totalMessages = msgcount;
        retVal.gotEmails = true;
        if (status === false) {
            handleError(retVal, "LIST failed");
            client.quit();
        } else {
            if (msgcount > 0)
                client.retr(currentMessageId);
            else
                client.quit();
        }
    });

    client.on("retr", function (status, msgnumber, data, rawdata) {
        if (status === true) {
            currentMessageId++;
            // parse the email to a json object.
            mailparser.write(data);
            mailparser.end();
            // get the next message
            client.retr(currentMessageId);
        } else {
            if (msgnumber !== (retVal.totalMessages + 1)) {
                handleError(retVal, "RETR failed for msgnumber " + msgnumber);
            }
            client.quit();
        }
    });

    mailparser.on("end", function (mail_object) {
        retVal.mailObjects.push(mail_object);
    });

    client.on("quit", function (status, rawdata) {
        finish(res, retVal);
    });
} // end of getEmail

function handleError(retVal, errorMessage) {
    retVal.errors.push(errorMessage);
}

function finish(res, retVal) {
    res.send(retVal);
}