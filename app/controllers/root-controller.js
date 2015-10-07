/**
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 20/11/2014.
 */
'use strict';

var util = require('util'),
    fs = require('fs'),
    web = require('most-web'),
    path = require('path');

/**
 * Root HTTP Controller class
 * @constructor
 * @augments {HttpController}
 */
function RootController() {
    //
}
util.inherits(RootController, web.controllers.HttpBaseController);

RootController.prototype.index = function(callback)
{
    callback(null, this.view());
};

RootController.prototype.locale = function(callback)
{
    var self = this;
    self.context.handle('GET', function() {
        if (self.context.format!='js') {
            self.context.handled = false;
            return;
        }
        try {
            //first of all get context language
            var culture = self.context.culture(),
                resource = self.context.params['resource'],
                resourcePath = web.current.mapPath('/locales/'.concat(resource, '.', culture.toLowerCase(),'.json'));
            //valdate file existance
            fs.exists(resourcePath, function(exists) {
                if (exists) {
                    var unmodifiedRequest = self.context.currentHandler.unmodifiedRequest || web.current.unmodifiedRequest || function(a,b,cb) { cb(null, false) };
                    unmodifiedRequest(self.context, resourcePath, function(err, result) {
                        if (result) {
                            self.context.response.writeHead(304);
                            callback(null,self.empty());
                        }
                        else {

                            //read file
                            fs.readFile(resourcePath, 'utf8', function(err, data) {
                                //and return JS script
                                try {

                                    web.current.resolveETag = web.current.resolveETag || function(a,cb) { cb(); };
                                    web.current.resolveETag(resourcePath, function(err, result) {
                                        if (result)
                                            self.context.response.setHeader('ETag' , result);
                                        callback(null,self.result('window.locales = window.locales || {}; window.locales.' + resource + '=' + data + ';'));
                                    });
                                }
                                catch (e) {
                                    console.log(e);
                                    //otherwise throw NOT FOUND exception
                                    callback(new web.common.HttpException());
                                }
                            });
                        }
                    });
                }
                else {
                    //otherwise throw NOT FOUND exception
                    callback(new web.common.HttpNotFoundException());
                }
            });
        }
        catch (e) {
            console.log(e);
            //otherwise throw NOT FOUND exception
            callback(new web.common.HttpException());
        }


    }).unhandle(function() {
        callback(new web.common.HttpMethodNotAllowed());
    });
};

RootController.prototype.routes = function(callback)
{
    var self = this;
    self.context.handle('GET', function() {
        if (self.context.format!='js') {
            self.context.handled = false;
            return;
        }
        try {
            //first of all get context language
            var resourcePath = path.join(process.cwd(),'config','routes.json');
            //validate file existence
            fs.exists(resourcePath, function(exists) {
                if (exists) {
                    var unmodifiedRequest = self.context.currentHandler.unmodifiedRequest || web.current.unmodifiedRequest || function(a,b,cb) { cb(null, false); };
                    unmodifiedRequest(self.context, resourcePath, function(err, result) {
                        if (result) {
                            self.context.response.writeHead(304);
                            callback(null,self.empty());
                        }
                        else {
                            //read file
                            fs.readFile(resourcePath, 'utf8', function(err, data) {
                                //and return JS script
                                try {
                                    web.current.resolveETag = web.current.resolveETag || function(a,cb) { cb(); };
                                    web.current.resolveETag(resourcePath, function(err, result) {
                                        if (result)
                                            self.context.response.setHeader('ETag' , result);
                                        callback(null,self.result('window.routes = ' + data + ';'));
                                    });
                                }
                                catch (e) {
                                    console.log(e);
                                    //otherwise throw NOT FOUND exception
                                    callback(new web.common.HttpException());
                                }
                            });
                        }
                    });
                }
                else {
                    //otherwise throw NOT FOUND exception
                    callback(new web.common.HttpNotFoundException());
                }
            });
        }
        catch (e) {
            console.log(e);
            //otherwise throw NOT FOUND exception
            callback(new web.common.HttpException());
        }


    }).unhandle(function() {
        callback(new web.common.HttpMethodNotAllowed());
    });
};

RootController.prototype.login = function(callback)
{
    var self = this;
    if (this.context.is('POST')) {
        //validate anti-forgery token
        self.context.validateAntiForgeryToken();
        //try to login
        var credentials = self.context.params.credentials;
        self.context.model('user').where('name').equal(credentials.username).and('userPassword').equal('{clear}' + credentials.password).silent().count(function(err, count) {
            if (err) {
                //callback(err);
                console.log(err);
                callback(null, self.view({message:'Login failed due to server error. Please try again or contact to system administrator.'}));
            }
            else {
                if (count==0) {
                    callback(null, self.view({message:'Unknown username or bad password. Please try again.'}));
                }
                else {
                    //set cookie
                    web.current.setAuthCookie(self.context, credentials.username);
                    var returnUrl = self.context.params['returnUrl'] || '/index.html';
                    callback(null, self.redirect(returnUrl));
                }
            }
        });
    }
    else {
        callback(null, this.view());
    }
};

RootController.prototype.logout = function(callback)
{
    var self = this;
    web.current.setAuthCookie(self.context, 'anonymous');
    callback(null, self.redirect(self.context.params['returnUrl'] || '/index.html'));
};

if (typeof module !== 'undefined') module.exports = RootController;
