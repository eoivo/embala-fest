import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, json, printf, colorize } = winston.format;

const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return JSON.stringify({
    level,
    timestamp,
    message,
    ...metadata,
  });
});

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: '20m',
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp(),
    json(),
    customFormat
  ),
  transports: [
    fileRotateTransport,
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${typeof message === 'object' ? JSON.stringify(message) : message}`;
        })
      ),
    })
  );
}