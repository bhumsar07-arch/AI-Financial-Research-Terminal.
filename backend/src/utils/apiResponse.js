// Standard success response helper
export const successResponse = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Standard error response helper
export const errorResponse = (res, message = "Internal Server Error", statusCode = 500, errorCode = "SERVER_ERROR") => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
};
