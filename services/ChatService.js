'use strict';

const _ =  require('lodash');
const async = require('async');
const config = require('config');
const twilio = require('twilio');
const chat = require('twilio-chat');
const randomize = require('randomatic');
const {User, Chat} = require('../models');
const {RuntimeError, ResourceNotFoundError, ValidationError} = require('../helpers/gearup-error-utils');
const {QueryHelper} = require('../helpers/gearup-query-utils');
const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;
const accountSid = config.get('chat.account_sid');
const authToken = config.get('chat.auth_token');
const chatServiceId = config.get('chat.chat_service_id');
const client = require('twilio')(accountSid, authToken);
let chatService = client.chat.services(chatServiceId);
let keyId = config.get('chat.key_id');
let secret = config.get('chat.secret');

/**
 * Creates an instance of the chat service
 */
class ChatService {

    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Generate token
     *
     * @param {object} swaggerParams - The swagger parameter
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     */
    generateToken(swaggerParams, res, next) {
        let client = swaggerParams.client.value;
        const appName = 'GearupChat';
        const endpointId = appName + ':' + client.identity + ':' + client.deviceId;
        const chatGrant = new ChatGrant({
            serviceSid: chatServiceId,
            endpointId: endpointId,
        });
        const token = new AccessToken(
            accountSid,
            keyId,
            secret
        );
        token.addGrant(chatGrant);
        token.identity = client.identity;
        let response = {
            identity: client.identity,
            token: token.toJwt()
        };
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(response));
    }

    /**
     * Creates new channel
     *
     * @param {object} swaggerParams - The swagger parameter
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     */
    createChannel(swaggerParams, res, next) {
        let channel = swaggerParams.channel.value;
        let senderId = channel.sender_id;
        let receiverId = channel.receiver_id;
        let identity = [senderId, receiverId];
        Chat.findOne({users: {$all: identity}}, (chatFindError, chatRecord) => {
            if (chatFindError) {
                let runtimeError = new RuntimeError(
                    'There was an error while fetching user chat details',
                    chatFindError
                );
                return next(runtimeError);
            }
            res.setHeader('Content-Type', 'application/json');
            if (_.isEmpty(chatRecord)) {
                let payload = {
                    friendlyName: channel.friendly_name,
                    uniqueName: randomize('Aa0', 10),
                    type: 'private',
                    createdBy: senderId
                };
                chatService.channels.create(payload, (error, channel) => {
                    if (error) {
                        let runtimeError = new RuntimeError(
                            'There was an error while creating channel',
                            error
                        );
                        return next(runtimeError);
                    }
                    async.eachLimit(identity, 1, (user, eachCb) => {
                        chatService.channels(channel.sid).members.create({identity: user}, (error, channelMember) => {
                            if (error) {
                                let runtimeError = new RuntimeError(
                                    'There was an error while adding channel members',
                                    error
                                );
                                return eachCb(runtimeError);
                            }
                            return eachCb();
                        });
                    }, (eachError) => {
                        if (eachError) {
                            return next();
                        }
                        chatRecord = new Chat({
                            users: identity,
                            channel_sid: channel.sid
                        });
                        chatRecord.save((saveError, saveRecord) => {
                            if (saveError) {
                                let runtimeError = new RuntimeError(
                                    'There was an error while adding new channel to the user\'s chat',
                                    saveError
                                );
                                return next(runtimeError);
                            }
                            res.statusCode = 201;
                            return res.end(JSON.stringify(saveRecord));
                        });
                    });
                });
            } else {
                chatService.channels(chatRecord.channel_sid).messages.list((msgErr, msgList) => {
                    if (msgErr) {
                        let runtimeError = new RuntimeError(
                            'There was an error while fetching particular user conversation',
                            msgErr
                        );
                        return next(runtimeError);
                    }
                    res.statusCode = 200;
                    return res.end(JSON.stringify(chatRecord));
                });
            }
        });
    }

    /**
     * Get channel list
     *
     * @param {object} req - The http request object
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     */
    getChannelList(req, res, next) {
        let userId = req.authentication.jwt.payload.user_id;
        let chatList = [];
        Chat.find({users: userId}, (chatFindError, chatRecords) => {
            res.setHeader('Content-Type', 'application/json');
            if (chatFindError) {
                let runtimeError = new RuntimeError(
                    'There was an error while fetching user chat details',
                    chatFindError
                );
                return next(runtimeError);
            }
            if (_.isEmpty(chatRecords)) {
                res.statusCode = 204;
                return res.end();
            }
            async.eachLimit(chatRecords, 5, (chatRecord, eachCb) => {
                let chatObj = chatRecord.toObject();
                let user = chatObj.users.filter((u) => u !== userId)[0];
                async.parallel([
                    (cb) => {
                        User.findOne({_id: {$in: user}}).select('-password').exec((userFindError, userRecord) => {
                            if (userFindError) {
                                let runTimeError = new RuntimeError(
                                    'There was an error while fetching channel users',
                                    userFindError
                                );
                                return cb(runTimeError);
                            }
                            return cb(null, userRecord);
                        });
                    },
                    (cb) => {
                        chatService.channels(chatObj.channel_sid).fetch((err, channelRecord) => {
                            if (err) {
                                let runTimeError = new RuntimeError(
                                    'There was an error while fetching channel details',
                                    err
                                );
                                return cb(runTimeError);
                            }
                            return cb(null, channelRecord);
                        });
                    }
                ], (parallelErr, parallelRes) => {
                    if (parallelErr) {
                        return eachCb(parallelErr);
                    }
                    let users = parallelRes[0];
                    let channel = parallelRes[1];
                    delete chatObj.users;
                    chatObj.user = users;
                    delete chatObj.channel_sid;
                    chatObj.channel = channel;
                    chatList.push(chatObj);
                    return eachCb();
                });
            }, (eachChatError) => {
                if (eachChatError) {
                    return next(eachChatError);
                }
                res.statusCode = 200;
                res.end(JSON.stringify(chatList));
            });
        });
    }

    /**
     * Send message
     *
     * @param {object} swaggerParams - The swagger parameter
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     */
    sendMsg(swaggerParams, res, next) {
        let channelId = swaggerParams.channel_id.value;
        let payload = swaggerParams.message.value;
        chatService.channels(channelId)
            .messages
            .create(payload, (msgErr, msgRes) => {
                if (msgErr) {
                    let runtimeError = new RuntimeError(
                        'There was an error while creating new message',
                        msgErr
                    );
                    return next(runtimeError);
                }
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                return res.end(JSON.stringify(msgRes));
            });
    }

    /**
     * Get message list of particular channel
     *
     * @param {object} swaggerParams - The swagger parameter
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     */
    async getMessageList(swaggerParams, res, next) {
        let query = QueryHelper.getQuery(swaggerParams);
        let channelId = swaggerParams.channel_id.value;
        const uri = `https://chat.twilio.com/v2/Services/${chatServiceId}/Channels/${channelId}/Messages?Order=desc&PageSize=${query.limit}`;
        let response = await client.request({ method: 'GET', uri: uri });
        let messages = response.body.messages;
        // let msgList = [];
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        return res.end(JSON.stringify(messages));
    }
}

/**
 * Checks for user existence
 *
 * @param {Object} query - The user findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckUser(query, callback) {
    User.findOne(query)
        .exec((userFindOneError, userRecord) => {
            if (userFindOneError) {
                let runtimeErrorObj = new RuntimeError(
                    'There was an error while finding user',
                    userFindOneError
                );
                return callback(runtimeErrorObj);
            }
            return callback(null, userRecord);
        });
}

module.exports = ChatService;
