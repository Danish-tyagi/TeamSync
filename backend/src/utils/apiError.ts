export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

export const notFound = (msg = 'Not found') => new ApiError(msg, 404)
export const unauthorized = (msg = 'Unauthorized') => new ApiError(msg, 401)
export const forbidden = (msg = 'Access denied') => new ApiError(msg, 403)
export const badRequest = (msg = 'Bad request') => new ApiError(msg, 400)
export const conflict = (msg = 'Conflict') => new ApiError(msg, 409)
