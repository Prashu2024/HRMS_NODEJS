export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
  
    constructor(message: string, statusCode: number, isOperational = true) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      Object.setPrototypeOf(this, new.target.prototype);
      if (typeof (Error as unknown as { captureStackTrace?: Function }).captureStackTrace === 'function') {
        (Error as unknown as { captureStackTrace: Function }).captureStackTrace(this, this.constructor);
      }
    }
  }
  
  export class BadRequestError extends AppError {
    constructor(message: string) { super(message, 400); }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') { super(message, 401); }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') { super(message, 403); }
  }
  
  export class NotFoundError extends AppError {
    constructor(resource = 'Resource') { super(`${resource} not found`, 404); }
  }
  
  export class ConflictError extends AppError {
    constructor(message: string) { super(message, 409); }
  }
  
  export class InternalServerError extends AppError {
    constructor(message = 'Internal server error') { super(message, 500, false); }
  }