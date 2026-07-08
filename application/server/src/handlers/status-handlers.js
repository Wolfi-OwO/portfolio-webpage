import { getStatusReport } from '../utils/status-checker.js';
import { InternalServerError } from '../middlewares/error-handlers.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns Public status report: overall status + per-monitor uptime history
 */
async function getServiceStatus(req, res, next) {
    try {
        const report = await getStatusReport();
        return res.json(report);
    } catch (err) {
        next(new InternalServerError(err));
    }
}

export { getServiceStatus };
