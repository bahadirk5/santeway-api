import {
  ValidationPipe,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';

export const GlobalValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    const errors = validationErrors.map((error) => ({
      field: error.property,
      errors: Object.values(error.constraints || {}),
    }));

    return new BadRequestException({
      statusCode: 400,
      message: 'Validation failed',
      errors,
    });
  },
});
