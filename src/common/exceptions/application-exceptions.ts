import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception for all application-specific exceptions
 * Provides consistent error structure
 */
export class ApplicationBaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly errorCode?: string,
    public readonly details?: any,
  ) {
    super(
      {
        message,
        errorCode,
        details,
      },
      statusCode,
    );
  }
}

/**
 * Exception for when a database resource is not found
 */
export class ResourceNotFoundException extends ApplicationBaseException {
  constructor(resourceType: string, identifier: string, details?: any) {
    super(
      `${resourceType} with identifier '${identifier}' was not found`,
      HttpStatus.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      details,
    );
  }
}

/**
 * Exception for when a database constraint is violated (e.g. duplicates)
 */
export class ResourceConflictException extends ApplicationBaseException {
  constructor(
    resourceType: string,
    field: string,
    value: string,
    details?: any,
  ) {
    super(
      `${resourceType} with ${field} '${value}' already exists`,
      HttpStatus.CONFLICT,
      'RESOURCE_CONFLICT',
      details,
    );
  }
}

/**
 * Exception for validation errors
 */
export class ValidationException extends ApplicationBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

/**
 * Exception for file operations
 */
export class FileOperationException extends ApplicationBaseException {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'FILE_OPERATION_ERROR',
      details,
    );
  }
}

/**
 * Exception for when a business rule is violated
 */
export class BusinessRuleViolationException extends ApplicationBaseException {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'BUSINESS_RULE_VIOLATION', details);
  }
}
