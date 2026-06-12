export function success(res, data = {}, message = 'Operation successful', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function error(res, message = 'Error', errors = [], statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
