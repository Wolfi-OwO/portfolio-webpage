/* ***************** HATEOAS helpers *********************** */
// Every JSON response in this API gets `_links` EXCEPT three cases: the
// secret voucher download (binary body, not a resource representation),
// 204 responses (no body to attach anything to — logout, delete), and error
// bodies (error-handlers.js's errorHandler is untouched on purpose, so a
// client can rely on an error shape that never carries navigation links).

const API_BASE = '/api';

function href(path) {
    return `${API_BASE}${path}`;
}

/**
 * Attaches `_links` to a resource. Accepts either a plain object or a live
 * Mongoose document — calling `.toJSON()` here, once, is what stops every
 * call site from having to remember it. Spreading a Mongoose document
 * directly copies its internal fields (`$__`, `_doc`, ...) instead of the
 * clean data shape, which is the mistake this centralizes the fix for.
 *
 * @param {object} resource
 * @param {object} links
 */
function withLinks(resource, links) {
    const plain = typeof resource?.toJSON === 'function' ? resource.toJSON() : resource;
    return { ...plain, _links: links };
}

/**
 * Link set for a CRUD collection (`self`/`create`) and its items
 * (`self?`/`update`/`delete`/`collection`), for the resources that expose
 * both a list and a per-id route.
 *
 * @param {string} path - resource path under API_BASE, e.g. '/projects'
 * @param {{ itemHasSelf?: boolean }} [options] - false when no `GET /:id`
 *        route exists for this resource (monitors)
 */
function crudLinks(path, { itemHasSelf = true } = {}) {
    return {
        list(req) {
            // `self` preserves the request's own query string (sort/filter/paging)
            // rather than rebuilding it, so it always reflects what was actually asked for.
            return {
                self: { href: req.originalUrl },
                create: { href: href(path), method: 'POST' },
            };
        },
        item(id) {
            const itemHref = `${href(path)}/${id}`;
            const links = {
                update: { href: itemHref, method: 'PUT' },
                delete: { href: itemHref, method: 'DELETE' },
                collection: { href: href(path) },
            };
            if (itemHasSelf) {
                links.self = { href: itemHref };
            }
            return links;
        },
    };
}

/** Link set for a single-object resource with no list/item split (info, activity, status). */
function objectLinks(path) {
    return { self: { href: href(path) }, root: { href: API_BASE } };
}

/** `GET /api` discovery root: one link to every resource, plus the two auth entry points. */
function apiRootLinks() {
    return {
        self: { href: API_BASE },
        info: { href: href('/info') },
        projects: { href: href('/projects') },
        technologies: { href: href('/technologies') },
        services: { href: href('/services') },
        availability: { href: href('/availability') },
        activity: { href: href('/activity') },
        status: { href: href('/status') },
        monitors: { href: href('/monitors') },
        contact: { href: href('/contact'), method: 'POST' },
        login: { href: '/auth/login', method: 'POST' },
        unlock: { href: '/auth/unlock', method: 'POST' },
    };
}

function authLoginLinks() {
    return { root: { href: API_BASE }, logout: { href: '/auth/logout', method: 'POST' } };
}

function authUnlockLinks() {
    return { voucher: { href: `${API_BASE}/secret/voucher` } };
}

/**
 * Wraps a list of documents into the `{ _links, count, items }` shape every
 * list endpoint (projects, technologies, services, availability, monitors)
 * returns. `linkSet` is one of the `crudLinks()` instances below.
 *
 * @param {import('express').Request} req
 * @param {object} linkSet
 * @param {Array<object>} docs
 */
function listPayload(req, linkSet, docs) {
    return {
        _links: linkSet.list(req),
        count: docs.length,
        items: docs.map((doc) => withLinks(doc, linkSet.item(doc._id ?? doc.id))),
    };
}

const projects = crudLinks('/projects');
const technologies = crudLinks('/technologies');
const services = crudLinks('/services');
const availability = crudLinks('/availability');
// No `GET /monitors/:id` route exists — nothing to point `self` at.
const monitors = crudLinks('/monitors', { itemHasSelf: false });
// Contact messages: anyone may POST, only the admin lists and deletes; no update, no GET by id.
const contact = {
    list(req) {
        return {
            self: { href: req.originalUrl },
            create: { href: href('/contact'), method: 'POST' },
        };
    },
    item(id) {
        return {
            delete: { href: `${href('/contact')}/${id}`, method: 'DELETE' },
            collection: { href: href('/contact') },
        };
    },
};

export {
    API_BASE,
    withLinks,
    objectLinks,
    apiRootLinks,
    authLoginLinks,
    authUnlockLinks,
    listPayload,
    projects,
    technologies,
    services,
    availability,
    monitors,
    contact,
};
