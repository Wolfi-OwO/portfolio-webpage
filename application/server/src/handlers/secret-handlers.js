import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { logger } from '../utils/logger.js';
import { InternalServerError, NotFound } from '../middlewares/error-handlers.js';

const STORAGE_ACCOUNT = process.env.STORAGE_ACCOUNT;
const STORAGE_KEY = process.env.STORAGE_KEY;
const GIFT_CONTAINER = process.env.GIFT_CONTAINER || 'secret-gifts';
const GIFT_BLOB = process.env.GIFT_BLOB || 'voucher-receipt.pdf';

// Built once. The credential is stateless and the client pools its own sockets,
// so rebuilding it per request would only cost handshakes.
let blobService = null;

/**
 * Managed identity first, account key only if one was handed over.
 *
 * In Azure the container app's own identity holds `Storage Blob Data Reader` on
 * this one account, which is the whole of what it needs - an account key would
 * carry write and delete over every container, for a job that reads one file.
 * `DefaultAzureCredential` also picks up the local `az login`, so leaving the
 * key unset works for development too. The key path stays for the case where
 * neither is available.
 */
function getBlobService() {
    if (!STORAGE_ACCOUNT) {
        return null;
    }

    if (!blobService) {
        const url = `https://${STORAGE_ACCOUNT}.blob.core.windows.net`;

        blobService = STORAGE_KEY
            ? new BlobServiceClient(
                  url,
                  new StorageSharedKeyCredential(STORAGE_ACCOUNT, STORAGE_KEY),
              )
            : new BlobServiceClient(url, new DefaultAzureCredential());
    }

    return blobService;
}

/**
 * Streams the gift receipt to a caller holding a valid `secret` token.
 *
 * The blob container has no anonymous access, and no SAS is ever handed to the
 * browser - the bytes are proxied through here. That is the whole point: the
 * receipt carries a home address and a card's last four digits, so a URL that
 * works without the password would undo the lock on the page it sits behind.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function downloadVoucherReceipt(_req, res, next) {
    const service = getBlobService();

    if (!service) {
        logger.error('Secret - STORAGE_ACCOUNT is not configured.');
        return next(new InternalServerError(new Error('Downloads are not configured.')));
    }

    try {
        const blob = service.getContainerClient(GIFT_CONTAINER).getBlobClient(GIFT_BLOB);

        if (!(await blob.exists())) {
            return next(new NotFound('The receipt is not there.'));
        }

        const download = await blob.download();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="gutschein-beleg.pdf"');

        // Nothing about this file should sit in a shared cache on the way back.
        res.setHeader('Cache-Control', 'private, no-store');

        if (download.contentLength) {
            res.setHeader('Content-Length', download.contentLength);
        }

        download.readableStreamBody.on('error', (err) => {
            logger.error(`Secret - the receipt stream broke... ${err.message}`);
            res.destroy(err);
        });

        return download.readableStreamBody.pipe(res);
    } catch (err) {
        return next(err);
    }
}

export { downloadVoucherReceipt };
