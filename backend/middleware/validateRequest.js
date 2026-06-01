const mongoose = require('mongoose');

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function validateValue(value, rule = {}, label, errors) {
  if (!hasValue(value)) {
    if (rule.required) errors.push(`${label} is required`);
    return;
  }

  if (rule.type === 'string' && typeof value !== 'string') {
    errors.push(`${label} must be a string`);
    return;
  }

  if (rule.type === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
    errors.push(`${label} must be a number`);
    return;
  }

  if (rule.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${label} must be a boolean`);
    return;
  }

  if (rule.type === 'objectId' && !isValidObjectId(value)) {
    errors.push(`${label} must be a valid ID`);
    return;
  }

  if (rule.type === 'date') {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      errors.push(`${label} must be a valid date`);
      return;
    }
  }

  if (rule.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${label} must be an array`);
      return;
    }
    if (rule.min !== undefined && value.length < rule.min) {
      errors.push(`${label} must contain at least ${rule.min} item${rule.min === 1 ? '' : 's'}`);
    }
    if (rule.items) {
      value.forEach((item, index) => {
        if (rule.items.type === 'object') {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            errors.push(`${label}[${index}] must be an object`);
            return;
          }
          for (const [field, itemRule] of Object.entries(rule.items.fields || {})) {
            validateValue(item[field], itemRule, `${label}[${index}].${field}`, errors);
          }
          return;
        }
        validateValue(item, rule.items, `${label}[${index}]`, errors);
      });
    }
  }

  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${label} must be one of: ${rule.enum.join(', ')}`);
  }

  if (rule.minLength !== undefined && typeof value === 'string' && value.trim().length < rule.minLength) {
    errors.push(`${label} must be at least ${rule.minLength} characters`);
  }

  if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
    errors.push(`${label} must be at most ${rule.maxLength} characters`);
  }
}

function validateBody(schema = {}) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rule] of Object.entries(schema)) {
      if (field.startsWith('$')) continue;
      if (!rule.required && typeof req.body?.[field] === 'string' && req.body[field].trim() === '') {
        req.body[field] = undefined;
      }
      validateValue(req.body?.[field], rule, field, errors);
    }

    if (schema.$atLeastOne) {
      const present = schema.$atLeastOne.some((field) => hasValue(req.body?.[field]));
      if (!present) errors.push(`At least one of ${schema.$atLeastOne.join(', ')} is required`);
    }

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  };
}

function validateAttendanceScanBody(req, res, next) {
  const { token, qrCode, sessionId } = req.body || {};
  const errors = [];

  if (hasValue(token)) {
    validateValue(token, { type: 'string' }, 'token', errors);
  } else {
    validateValue(qrCode, { type: 'string', required: true }, 'qrCode', errors);
    validateValue(sessionId, { type: 'objectId', required: true }, 'sessionId', errors);
  }

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
}

function validateObjectIdParam(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!isValidObjectId(value)) {
      return res.status(400).json({ message: `Invalid ${paramName}` });
    }

    next();
  };
}

module.exports = {
  isValidObjectId,
  validateAttendanceScanBody,
  validateBody,
  validateObjectIdParam,
};
