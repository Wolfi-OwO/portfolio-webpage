const TOKEN_STORAGE_KEY = 'portfolio.adminToken';

function getAdminToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function isAdmin() {
    return Boolean(getAdminToken());
}

function clearAdminToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function authHeaders() {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export { TOKEN_STORAGE_KEY, getAdminToken, isAdmin, clearAdminToken, authHeaders };
