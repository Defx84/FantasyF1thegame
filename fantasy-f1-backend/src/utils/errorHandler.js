/**
 * Centralized error handler for consistent error responses
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
const handleError = (res, error) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.name === 'MongoServerError' && error.code === 11000) {
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate entry',
      field: Object.keys(error.keyPattern)[0]
    });
  }

  // Add development mode error details
  const errorResponse = {
    status: 'error',
    message: 'Internal server error'
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = error.message;
    errorResponse.stack = error.stack;
  }

  res.status(500).json(errorResponse);
};

module.exports = {
  handleError
}; 