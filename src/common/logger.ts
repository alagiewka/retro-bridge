import { ConsoleLogger, Inject, Injectable, Scope } from '@nestjs/common';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';

export class BaseLogger extends ConsoleLogger {
  public static readonly getTimestamp = (): string => new Date().toISOString();

  protected readonly prepareMessage = (
    level: string,
    message: any,
    context?: string,
    stack?: string,
    traceId?: string,
  ): string => {
    const isLimitedContext = context && level === 'INFO';

    return [
      `[${BaseLogger.getTimestamp()}]`,
      traceId,
      level,
      isLimitedContext ? `${this.context}.${context}` : this.context,
      this.formatMessage(message),
      stack,
    ]
      .filter((x) => x)
      .join('\t');
  };

  public readonly formatMessage = (input): string => {
    if (typeof input === 'string') {
      return input;
    }
    if (input.name && input.message) {
      return `${input.name}: ${input.message}`;
    }

    return JSON.stringify(input, null, 2);
  };

  public readonly error = (
    message: any,
    stack?: string,
    context?: string,
  ): void => {
    console.error(this.prepareMessage('ERROR', message, context, stack));
  };

  public readonly log = (message: any, context?: string): void => {
    console.log(this.prepareMessage('INFO', message, context));
  };

  public readonly verbose = (message: any, context?: string): void => {
    console.log(this.prepareMessage('VERBOSE', message, context));
  };

  public readonly debug = (message: any, context?: string): void => {
    console.debug(this.prepareMessage('DEBUG', message, context));
  };

  public readonly warn = (message: any, context?: string): void => {
    console.warn(this.prepareMessage('WARN', message, context));
  };
}

@Injectable({ scope: Scope.TRANSIENT })
export class Logger extends BaseLogger {}

@Injectable({
  scope: Scope.REQUEST,
})
export class RequestLogger extends Logger {
  constructor(@Inject(REQUEST) private readonly request: Request) {
    super();
  }

  private getCorrelationId(): string {
    return this.request.header('x-correlation-id');
  }

  public readonly error = (
    message: any,
    stack?: string,
    context?: string,
  ): void => {
    console.error(
      this.prepareMessage(
        'ERROR',
        message,
        context,
        stack,
        this.getCorrelationId(),
      ),
    );
  };

  public readonly log = (message: any, context?: string): void => {
    console.log(
      this.prepareMessage(
        'INFO',
        message,
        context,
        null,
        this.getCorrelationId(),
      ),
    );
  };

  public readonly verbose = (message: any, context?: string): void => {
    console.log(
      this.prepareMessage(
        'VERBOSE',
        message,
        context,
        null,
        this.getCorrelationId(),
      ),
    );
  };

  public readonly debug = (message: any, context?: string): void => {
    console.debug(
      this.prepareMessage(
        'DEBUG',
        message,
        context,
        null``,
        this.getCorrelationId(),
      ),
    );
  };

  public readonly warn = (message: any, context?: string): void => {
    console.warn(
      this.prepareMessage(
        'WARN',
        message,
        context,
        null,
        this.getCorrelationId(),
      ),
    );
  };
}
