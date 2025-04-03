import { Server, Request, Response } from 'restify';
import errors from 'restify-errors';
import { ApplicationError } from '@app/errors/ApplicationError';

// Problem Details interface (can be shared or defined here)
interface ProblemDetails {
    type?: string;
    title: string;
    status: number;
    detail: string;
    instance?: string;
    code?: string;
}

function handleRestifyError(req: Request, res: Response, err: any, callback: () => void): void {
    console.error(`--- Restify Error Handler Start ---`);
    console.error(`Error on ${req.method} ${req.url}:`, err?.message);
    console.error(`Error Constructor Name:`, err?.constructor?.name);

    let statusCode: number;
    let problemDetails: ProblemDetails;

    if (err instanceof ApplicationError) {
        console.log('Handling as ApplicationError...');
        statusCode = err.httpStatusCode || 400;
        problemDetails = {
            title: err.name || 'Application Error',
            status: statusCode,
            detail: err.message,
            code: err.code || 'ApplicationError',
            instance: req.url
        };
    } else if (err instanceof errors.HttpError) {
        console.log('Handling as RestError...');
        statusCode = err.statusCode;
        problemDetails = {
            title: err.name || 'Http Error',
            status: statusCode,
            detail: err.message || 'An HTTP error occurred',
            code: err.code || err.name,
            instance: req.url
        };
    } else {
        console.log('Handling as Unexpected Error...');
        statusCode = 500;
        problemDetails = {
            title: 'Internal Server Error',
            status: statusCode,
            detail: err?.message || 'An unexpected internal server error occurred.',
            code: err?.constructor?.name || 'InternalServerError',
            instance: req.url
        };
        console.error('Unexpected Error Details Stack:', err?.stack);
    }
    
    if (!res.headersSent) {
        console.log(`Sending Problem Details Response: ${statusCode}`);
        res.setHeader('Content-Type', 'application/problem+json');
        res.send(statusCode, problemDetails);
    } else {
        console.error('Headers already sent, cannot send error response.');
    }
    console.error(`--- Restify Error Handler End ---`);
    // callback(); // Decide if you need to call the callback based on Restify docs/behavior
}

function handleUncaughtException(req: Request, res: Response, route: any, err: Error): void {
    console.error('--- Uncaught Exception Handler --- ');
    console.error('Error caught by uncaughtException:', err);
    if (!res.headersSent) {
        const statusCode = 500;
        const problemDetails: ProblemDetails = {
            title: 'Internal Server Error',
            status: statusCode,
            detail: 'An unexpected internal server error occurred due to an uncaught exception.',
            code: 'UncaughtException',
            instance: req?.url
        };
        res.setHeader('Content-Type', 'application/problem+json');
        res.send(statusCode, problemDetails);
    }
}

export function setupErrorHandlers(server: Server): void {
    server.on('restifyError', handleRestifyError);
    server.on('uncaughtException', handleUncaughtException);
    console.log('Centralized error handlers registered.');
} 