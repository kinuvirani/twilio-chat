'use strict'

const AuthenticationService = require('../services/AuthenticationService');

/**
 * Creates a new user
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.userSignUp =function userSignUp(req, res, next) {
    let authenticationService = new AuthenticationService(req.logger);
    authenticationService.userSignUp(req.swagger.params, res, next);
}

/**
 * Allows user sign-in
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.userSignIn =function userSignIn(req, res, next) {
    let authenticationService = new AuthenticationService(req.logger);
    authenticationService.userSignIn(req.swagger.params, res, next);
}

/**
 * Gets user details
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getUser = function getUser(req, res, next) {
    let authenticationService = new AuthenticationService(req.Logger);
    authenticationService.getUser(req.swagger.params, res, next);
};

/**
 * Updates user details
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateUserDetails = function updateUserDetails(req, res, next) {
    let authenticationService = new AuthenticationService(req.Logger);
    authenticationService.updateUserDetails(req.swagger.params, res, next);
};

/**
 * Change  user password
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.changePassword = function changePassword(req, res, next) {
    let authenticationService = new AuthenticationService(req.Logger);
    authenticationService.changePassword(req.swagger.params, res, next);
};

/**
 * Get user list
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getUserList = function getUserList(req, res, next) {
    let authenticationService = new AuthenticationService(req.Logger);
    authenticationService.getUserList(req, res, next);
};