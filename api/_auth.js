function isAuthenticated(req) {
  // 1. Check Cookie
  const cookieHeader = req.headers.cookie || '';
  if (/(?:^|;\s*)softride_admin=authenticated(?:;|$)/.test(cookieHeader)) {
    return true;
  }

  // 2. Check Authorization Header (Bearer softride-admin-token)
  const authHeader = req.headers.authorization || '';
  if (authHeader === 'Bearer softride-admin-token' || authHeader === 'softride-admin-token') {
    return true;
  }

  // 3. Check X-Admin-Token
  if (req.headers['x-admin-token'] === 'softride-admin-token') {
    return true;
  }

  return false;
}

module.exports = { isAuthenticated };
