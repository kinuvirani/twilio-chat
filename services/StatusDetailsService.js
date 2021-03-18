'use strict';

/**
 * Creates an instance of the status details service
 */
class StatusDetailsService {

    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Gets the system status(uptime)
     *
     * @param {object} swaggerParams - The request arguments passed in from the controller
     * @param {IncomingMessage} res - The http response object
     * @param {function} next - The callback used to pass control to the next action/middleware
     *
     * @return void
     */
    getSystemStatus(swaggerParams, res) {
        let objStatus = {
            'up_time': Math.floor(process.uptime())
        };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(objStatus));
    }
}

module.exports = StatusDetailsService;
