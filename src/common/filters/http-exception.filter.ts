import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

/**
 * Global exception filter that handles all exceptions in a consistent way
 * Provides standardized error responses with additional metadata
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate unique error reference ID for tracking
    const errorRef = uuid().slice(0, 8).toUpperCase();

    let status: HttpStatus;
    let errorResponse: any;

    if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract error details
      errorResponse =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : exceptionResponse;
    } else {
      // Handle unexpected exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        message: 'Internal server error',
        error: 'Internal Server Error',
      };

      // Only log stack traces for unexpected errors
      this.logger.error(
        `Unexpected error [${errorRef}]: ${exception.message}`,
        exception.stack,
      );
    }

    // Log all errors with context
    this.logger.error(
      `Error [${errorRef}] ${status} ${request.method} ${request.url}: ${errorResponse.message}`,
    );

    // Format the error response
    const formattedResponse = {
      statusCode: status,
      error: errorResponse.error || this.getErrorNameFromStatus(status),
      message: errorResponse.message || 'An error occurred',
      errorRef,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(errorResponse.details ? { details: errorResponse.details } : {}),
    };

    // Send the response
    response.status(status).json(formattedResponse);
  }

  /**
   * Maps HTTP status code to appropriate error name
   */
  private getErrorNameFromStatus(status: HttpStatus): string {
    const statusMap = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };

    return statusMap[status] || 'Unknown Error';
  }
}
