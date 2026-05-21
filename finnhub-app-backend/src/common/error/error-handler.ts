import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

/**
 * Handles an error by logging a custom message and rethrowing the appropriate HTTP exception.
 *
 * @param {string} customMessage - A custom message describing the context of the error.
 * @param {Logger} logger - A NestJS Logger instance to log the error.
 * @param {unknown} error - The original error object.
 * @throws {HttpException} Throws the mapped HTTP exception based on the type of the error.
 * @returns {never} This function never returns; it always throws an exception.
 */
export const errorHandler = (
  customMessage: string,
  logger: Logger,
  error: unknown,
): never => {
  const exception = exceptionHandler(error);
  logger.error(`${customMessage} - ${exception.message}`);
  throw exception;
};

/**
 * Maps a given error to the corresponding NestJS HTTP exception.
 *
 * - If the error is already an HttpException (NotFoundException, UnauthorizedException, etc.), it is returned as-is.
 * - All other errors are mapped to InternalServerErrorException.
 *
 * @param {unknown} error - The original error object.
 * @returns {HttpException} The appropriate NestJS HTTP exception corresponding to the error type.
 */
export const exceptionHandler = (error: unknown): HttpException => {
  if (error instanceof HttpException) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : 'Internal server error';

  return new InternalServerErrorException(message);
};
