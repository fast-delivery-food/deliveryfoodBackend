import {
    ArgumentsHost,
    Catch,
    ConflictException,
    ExceptionFilter,
    HttpException,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { QueryFailedError } from 'typeorm';
  
  const catchUniqueFieldError = (exception: Error): HttpException | Error => {
    if (exception instanceof QueryFailedError) {
      const message = exception.message.toLowerCase();
      if (message.includes('duplicate key value') || message.includes('unique constraint')) {
        const errorMsg = 'A unique field constraint was violated. Please provide a different value.';
        return new ConflictException(errorMsg);
      }
    }
  
    return exception;
  };
  
  @Catch()
  export class ExceptionHandlerFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
  
      const requestTime = new Date().toISOString();
  
      exception = catchUniqueFieldError(exception);
  
      console.log(exception);
  
      if (exception instanceof HttpException) {
        return response.status(exception.getStatus()).json({
          message: exception.message,
          requestTime,
          url: request.url,
          errorName: exception.name,
          statusCode: exception.getStatus(),
        });
      }
  
      if (exception instanceof QueryFailedError) {
        return response.status(409).json({
          message: 'Database error: ' + exception.message,
          requestTime,
          url: request.url,
          errorName: exception.name,
        });
      }
  
      return response.status(500).json({
        message: exception?.message || 'Internal server error',
        requestTime,
        url: request.url,
        errorName: exception?.name,
        statusCode: 500,
      });
    }
}
  export default ExceptionHandlerFilter