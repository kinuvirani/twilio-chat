'use strict'

const StatusDetailsService = require('../services/StatusDetailsService');

module.exports.getSystemStatus =function getSystemStatus(req, res, next) {
    let statusDetailService =new StatusDetailsService(req.logger);
    statusDetailService.getSystemStatus(req.swagger.params, res, next);
}