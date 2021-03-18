'use strict';

const _ =  require('lodash');
const {User} = require('../models');
const passwordHash = require('password-hash');
const JWTSecurityHelper = require('../helpers/JWTSecurityHelper');
const {RuntimeError, ResourceNotFoundError, ValidationError} = require('../helpers/gearup-error-utils');


/**
 * Creates an instance of the authentication service
 */
class AuthenticationService {

    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Creates a new user
     *
     * @param {object} swaggerParams - The request arguments passed in from the controller
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     *
     * @return void
     */
    userSignUp(swaggerParams, res, next) {
        let user = swaggerParams.user.value;
        CheckUser({email: user.email} , (userFindOneError, userRecord) => {
            if (userFindOneError) {
                return next(userFindOneError);
            }
            if (!_.isEmpty(userRecord)) {
                let validationErrorObj = new ValidationError(
                    'Whoops!\n A user with that email address already exists!'
                );
                return next(validationErrorObj);
            }
            let userDetail = new User({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                password: passwordHash.generate(user.password)
            });
            userDetail.save((saveError, userRecord) => {
                if (saveError) {
                    let runTimeError =  new RuntimeError(
                        'There was an error while saving user data',
                        saveError
                    );
                    return next(runTimeError);
                }
                let tokenPayload = {
                    user_id: userRecord._id,
                    email: userRecord.email,
                    firstname: userRecord.firstname,
                    lastname: userRecord.lastname
                };
                JWTSecurityHelper.signJWT(tokenPayload, (signError, signToken) => {
                    if (signError) {
                        return next(signError);
                    }
                    const userCheckResult = _.extend(tokenPayload, signToken);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 201;
                    res.end(JSON.stringify(userCheckResult));
                });
            })
        });
    }

    /**
     * Allows user sign-in
     *
     * @param {object} swaggerParams - The request arguments passed in from the controller
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     *
     * @return void
     */
    userSignIn(swaggerParams, res, next) {
        let user = swaggerParams.user.value;
        User.findOne({email: user.email} , (userFindOneError, userRecord) => {
            if (userFindOneError) {
                let runtimeErrorObj = new RuntimeError(
                    'There was an error while finding user',
                    userFindOneError
                );
                return next(runtimeErrorObj);
            }
            if (_.isEmpty(userRecord)) {
                let resourceNotFoundError = new ResourceNotFoundError(
                    'Whoops!\n A user with that email does not exists!'
                );
                return next(resourceNotFoundError);
            }
            let verifyPassword = passwordHash.verify(user.password, userRecord.password);
            if (!verifyPassword) {
                let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                    'Hmmm...\n That password is not working. Please try again.'
                );
                return next(resourceNotFoundOErrorObj);
            }
            let tokenPayload = {
                user_id: userRecord._id,
                email: userRecord.email,
                firstname: userRecord.firstname,
                lastname: userRecord.lastname
            };
            JWTSecurityHelper.signJWT(tokenPayload, (signError, signToken) => {
                if (signError) {
                    return next(signError);
                }
                const userCheckResult = _.extend(tokenPayload, signToken);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(userCheckResult));
            });
        });
    }

    /**
     * Gets user details
     *
     * @param {object} swaggerParams - The request arguments passed in from the controller
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     *
     * @return void
     */
    getUser(swaggerParams, res, next) {
        let userId = swaggerParams.user_id.value;
        CheckUser({_id: userId} , (userFindOneError, userRecord) => {
            if (userFindOneError) {
                return next(userFindOneError);
            }
            if (_.isEmpty(userRecord)) {
                let resourceNotFoundError = new ResourceNotFoundError(
                    'Whoops!\n A user with id does not exists!'
                );
                return next(resourceNotFoundError);
            }
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(userRecord));
        });
    }

    /**
     * Updates user details
     *
     * @param {object} swaggerParams - The request arguments passed in from the controller
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     *
     * @return void
     */
    updateUserDetails(swaggerParams, res, next) {
        let userId = swaggerParams.user_id.value;
        let user = swaggerParams.user.value;
        CheckUser({_id: userId} , (userFindOneError, userRecord) => {
            if (userFindOneError) {
                return next(userFindOneError);
            }
            if (_.isEmpty(userRecord)) {
                let resourceNotFoundError = new ResourceNotFoundError(
                    'Whoops!\n A user with id does not exists!'
                );
                return next(resourceNotFoundError);
            }
            userRecord.firstname = user.firstname ? user.firstname : userRecord.firstname;
            userRecord.lastname = user.lastname ? user.lastname : userRecord.lastname;
            userRecord.contact_no = user.contact_no ? user.contact_no : userRecord.contact_no;
            userRecord.profile_img = user.profile_img ? user.profile_img : userRecord.profile_img;
            userRecord.save((saveError, saveRecord) => {
                if (saveError) {
                    let runtimeErrorObj = new RuntimeError(
                        'There was an error while updating user details of user ' + userId,
                        saveError
                    );
                    return next(runtimeErrorObj);
                }
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(saveRecord));
            });
        });
    }

    /**
     * Change  user password
     *
     * @param {object} swaggerParams - The request arguments passed in from the controller
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     *
     * @return void
     */
    changePassword(swaggerParams, res, next) {
        let userId = swaggerParams.user_id.value;
        let user = swaggerParams.user.value;
        CheckUser({_id: userId} , (userFindOneError, userRecord) => {
            if (userFindOneError) {
                return next(userFindOneError);
            }
            if (_.isEmpty(userRecord)) {
                let resourceNotFoundError = new ResourceNotFoundError(
                    'Whoops!\n A user with id does not exists!'
                );
                return next(resourceNotFoundError);
            }
            let verifyPassword = passwordHash.verify(user.old_password, userRecord.password);
            if (!verifyPassword) {
                let resourceNotFoundOErrorObj = new ResourceNotFoundError(
                    'The old password does not match'
                );
                return next(resourceNotFoundOErrorObj);
            }
            userRecord.password = passwordHash.generate(user.new_password);
            userRecord.save((saveError, saveRecord) => {
                if (saveError) {
                    let runtimeErrorObj = new RuntimeError(
                        'There was an error while updating user details of user ' + userId,
                        saveError
                    );
                    return next(runtimeErrorObj);
                }
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify(saveRecord));
            });
        });
    }

    /**
     * Get user list
     *
     * @param {object} req - The http request object
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     *
     * @return void
     */
    getUserList(req, res, next) {
        let userId = req.authentication.jwt.payload.user_id;
        //Find all user who has been added in channel
        User.find({_id: {$ne: userId}} , (userFindOneError, userRecord) => {
            if (userFindOneError) {
                return next(userFindOneError);
            }
            if (_.isEmpty(userRecord)) {
                res.statusCode = 204;
                return res.end();
            }
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(userRecord));
        });
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

module.exports = AuthenticationService;
