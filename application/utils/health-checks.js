import connection from 'mongoose';
import { createTerminus } from '@godaddy/terminus';
import { logger } from './logger.js';

// taken from https://github.com/godaddy/terminus/blob/main/example/mongoose/express.js

function setupHealthChecks(server) {
    const terminusOptions = {
        signal: ['SIGINT', 'SIGTERM'],
        healthChecks: {
            '/api/ready': onReadinessCheck,
            '/api/live': onLivenessCheck,
        },
        beforeShutdown: () => {
            logger.info('Backend - Stopping with grace period of 5 secs');
            return new Promise(resolve => {
                setTimeout(resolve, 5000);
            });
        },
        onSignal,
    };

    createTerminus(server, terminusOptions);
}

function onReadinessCheck() {
    // https://mongoosejs.com/docs/api.html#connection_Connection-readyState
    const { readyState } = connection;

    // ERR_CONNECTING_TO_MONGO
    if (readyState === 0 || readyState === 3) {
        return Promise.reject(new Error('Mongoose has disconnected'));
    }
    // CONNECTING_TO_MONGO
    if (readyState === 2) {
        return Promise.reject(new Error('Mongoose is connecting'));
    }
    // CONNECTED_TO_MONGO
    return Promise.resolve();
}

function onLivenessCheck() {
    return Promise.resolve();
}

function onSignal() {
    logger.info('Backend - Starting shutdown');

    return new Promise((resolve, reject) => {
        connection
            .close(false)
            .then(() => {
                logger.info('DB - Connection closed');
                logger.info('Backend - Finished shutdown');
                resolve();
            })
            .catch(reject);
    });
}

export { setupHealthChecks };
