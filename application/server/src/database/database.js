import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const dbConnectTimeout = 1000;

/**
 * The connection string minus its credentials.
 *
 * Which cluster and which database this process ended up on is the first thing
 * worth knowing when something looks wrong, so the line is worth keeping. The
 * password in it is not: a log line outlives the deployment that wrote it, gets
 * shipped somewhere central and read by people who have no other reason to hold
 * the database password.
 *
 * @param {string} connectionString
 * @returns {string} the same URI with the password replaced
 */
function withoutCredentials(connectionString) {
    try {
        const url = new URL(connectionString);

        if (url.password) {
            url.password = '***';
        }

        return url.toString();
    } catch {
        // Unparseable, so there is no telling which part of it is the password.
        return '[connection string]';
    }
}

async function setupDatabaseConnection(connectionString, recreateDatabase) {
    try {
        logger.info(`DB - Setting up connection using ${withoutCredentials(connectionString)}`);

        if (recreateDatabase) {
            logger.info(`DB - Start dropping current database`);
            await dropCurrentDatabase(connectionString);
            logger.info('DB - Current database dropped !!');
        }

        await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: dbConnectTimeout,
            retryWrites: false,
            retryReads: false,
        });

        logger.info(`DB - Connection to ${withoutCredentials(connectionString)} established.`);
    } catch (err) {
        logger.error('DB - Unable to setup connection... ', err);
        process.exit(1);
    }
}

async function dropCurrentDatabase(connectionString) {
    let connection = await mongoose
        .createConnection(connectionString, {
            serverSelectionTimeoutMS: dbConnectTimeout,
        })
        .asPromise();
    await connection.dropDatabase();
}

export { setupDatabaseConnection, dropCurrentDatabase };
