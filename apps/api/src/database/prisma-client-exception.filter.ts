import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Global exception filter for Prisma database errors.
 * Catches known Prisma request errors and maps them to standard HTTP status codes
 * without leaking internal database schema, SQL queries, or connection metadata.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    switch (exception.code) {
      case 'P2025':
        // Record not found (e.g. record required for update/delete does not exist)
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        error = 'Not Found';
        break;

      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = 'A resource with this identifier or unique field already exists';
        error = 'Conflict';
        break;

      case 'P2003':
        // Foreign key constraint failure
        status = HttpStatus.BAD_REQUEST;
        message = 'Related resource constraint violation';
        error = 'Bad Request';
        break;

      case 'P2023':
        // Inconsistent column data / malformed parameter (e.g. invalid UUID format)
        status = HttpStatus.BAD_REQUEST;
        message = 'Inconsistent or malformed data provided';
        error = 'Bad Request';
        break;

      default:
        // Log unexpected Prisma errors server-side with stack trace
        this.logger.error(
          `Unhandled Prisma Error [${exception.code}]: ${exception.message}`,
          exception.stack,
        );
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'An unexpected database error occurred';
        error = 'Internal Server Error';
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}
