import mongoose from 'mongoose';

const DEFAULT_SORTING_PARAMS = {
    projects: '+createdAt',
};

/**
 * Validates and processes query parameters for API requests.
 * @param {Object} query - The query object from the request
 * @param {...string} allowedFields - Allowed fields for sorting
 * @returns {Object} Processed query parameters with sort, limit, offset, embed, and filter
 * @throws {mongoose.Error.ValidationError} If validation fails
 */
function validateQueryParams(query, ...allowedFields) {
    let { sort, limit, offset, embed, ...filter } = query;
    const error = new mongoose.Error.ValidationError();

    addError(error, 'sorting', validateSortingParameters(sort, allowedFields));

    addError(error, 'paging', validatePaging(offset, limit));

    if (Object.keys(error.errors).length > 0) {
        throw error;
    }

    filter = convertFilterParams(filter);
    return { sort, limit, offset, embed, filter };
}

/**
 * Adds an error to a mongoose ValidationError if the message is not empty.
 * @param {mongoose.Error.ValidationError} error - The validation error object
 * @param {string} path - The path for the error
 * @param {string} message - The error message
 */
function addError(error, path, message) {
    if (message.length > 0) {
        error.addError(path, new mongoose.Error.ValidatorError({ message }));
    }
}

/**
 * Converts filter parameters from query string to MongoDB filter format.
 * @param {Object} filter - The filter object
 * @returns {Object} Converted filter object for MongoDB
 */
function convertFilterParams(filter) {
    const convertedFilter = {};
    const andConditions = [];

    function escapeRegex(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    for (const key in filter) {
        let filterValue = filter[key];

        // Skip empty string filters (including whitespace) to avoid accidental
        // matching against empty values (which would filter out all results).
        if (typeof filterValue === 'string' && filterValue.trim() === '') {
            continue;
        }
        const isNotOperator = typeof filterValue === 'string' && filterValue?.startsWith('!');

        if (isNotOperator) {
            filterValue = filterValue.substring(1);
        }

        if (typeof filterValue === 'string' && filterValue.startsWith('[') && filterValue.endsWith(']')) {
            filterValue = JSON.parse(filterValue);
        }

        if (key === 'labels' && typeof filterValue === 'string' && filterValue.length > 0) {
            const orGroups = filterValue
                .split('|')
                .filter(g => g)
                .map(g => g.split(','));

            if (orGroups.length > 0) {
                andConditions.push({
                    $or: orGroups.map(group => ({
                        'labels.name': { $all: group },
                    })),
                });
            }
            continue;
        }

        if (Array.isArray(filterValue)) {
            convertedFilter[key] = isNotOperator ? { $not: { $in: filterValue } } : { $in: filterValue };
        } else if (key === 'search') {
            const safe = escapeRegex(filterValue);
            const regex = new RegExp(`.*${safe}.*`, 'gi');

            andConditions.push({
                $or: [
                    { title: regex },
                    { topic: regex },
                    { creator: regex },
                    { description: regex },
                    { 'labels.name': regex },
                ],
            });
        } else if (key === 'searchLabels') {
            const safe = escapeRegex(filterValue);
            andConditions.push({
                $or: [{ 'labels.name': new RegExp(`.*${safe}.*`, 'gi') }],
            });
        } else {
            const safe = escapeRegex(filterValue);
            convertedFilter[key] = isNotOperator ? { $not: new RegExp(`.*${safe}.*`, 'g') } : filterValue;
        }
    }

    // Combine all $or conditions with $and so they work together
    if (andConditions.length === 1) {
        convertedFilter['$or'] = andConditions[0]['$or'];
    } else if (andConditions.length > 1) {
        convertedFilter['$and'] = andConditions;
    }

    return convertedFilter;
}

/**
 * Validates sorting parameters against allowed fields.
 * @param {string} sortBy - The sort string (comma-separated)
 * @param {Array<string>} allowedFields - Array of allowed field names
 * @returns {string} Validation error message or empty string if valid
 */
function validateSortingParameters(sortBy, allowedFields) {
    if (!sortBy) return '';

    const sortingParameters = sortBy.split(',');
    let validation = '';

    // check if fields are allowed
    for (let sortingParam of sortingParameters) {
        sortingParam = sortingParam.replace('-', '');

        if (!allowedFields.includes(sortingParam)) {
            validation = validation + ` The sorting key ${sortingParam} is not valid!`;
        }
    }
    return validation;
}

/**
 * Validates paging parameters (offset and limit).
 * @param {number|string} offset - The offset value
 * @param {number|string} limit - The limit value
 * @returns {string} Validation error message or empty string if valid
 */
function validatePaging(offset, limit) {
    let validation = '';
    if (isNaN(limit) && typeof limit !== 'undefined') {
        validation = validation + 'Limit needs to be a number!';
    }

    if (isNaN(offset) && typeof offset !== 'undefined') {
        validation = validation + ' Offset needs to be a number!';
    }

    if (limit && limit <= 0) {
        validation = validation + ` Limit cannot be bellow or equal zero!`;
    }

    if (offset && offset < 0) {
        validation = validation + ` Limit cannot be bellow or equal zero!`;
    }

    return validation;
}

/**
 * Recursively removes null and undefined values from an object.
 * @param {Object} obj - The object to clean
 * @returns {Object} The cleaned object
 */
function removeNullValues(obj) {
    Object.keys(obj).forEach(
        key =>
            (obj[key] && typeof obj[key] === 'object' && removeNullValues(obj[key])) ||
            ((obj[key] === undefined || obj[key] === null) && delete obj[key]),
    );
    return obj;
}

export { removeNullValues, validateQueryParams, DEFAULT_SORTING_PARAMS };
