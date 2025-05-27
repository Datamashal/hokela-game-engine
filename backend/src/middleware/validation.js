
const Joi = require('joi');

const logSchema = Joi.object({
  level: Joi.string().valid('info', 'warn', 'error', 'success', 'debug').required(),
  message: Joi.string().max(1000).required(),
  service: Joi.string().max(100).required(),
  endpoint: Joi.string().max(200).optional(),
  statusCode: Joi.number().integer().min(100).max(599).optional(),
  processingTime: Joi.number().min(0).optional(),
  userId: Joi.string().max(100).optional(),
  requestId: Joi.string().max(100).optional(),
  metadata: Joi.object().optional()
});

const validateLog = (data) => {
  return logSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateLog
};
