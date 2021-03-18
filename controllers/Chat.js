'use strict';

const ChatService = require('../services/ChatService');

/**
 * Generate token
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.generateToken = function generateToken(req, res, next) {
    let chatService = new ChatService(req.Logger);
    chatService.generateToken(req.swagger.params, res, next);
};

/**
 * Creates new channel
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createChannel = function createChannel(req, res, next) {
    let chatService = new ChatService(req.Logger);
    chatService.createChannel(req.swagger.params, res, next);
};

/**
 * Get channel list
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getChannelList = function getChannelList(req, res, next) {
    let chatService = new ChatService(req.Logger);
    chatService.getChannelList(req, res, next);
};

/**
 * Send message
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.sendMsg  = function sendMsg(req, res, next) {
    let chatService = new ChatService(req.Logger);
    chatService.sendMsg(req.swagger.params, res, next);
};

/**
 * Get message list
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getMessageList  = function getMessageList(req, res, next) {
    let chatService = new ChatService(req.Logger);
    chatService.getMessageList(req.swagger.params, res, next);
};