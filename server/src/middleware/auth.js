// shortcut: FAKE auth, every request is accepted. A replaces the inside with a real JWT check
// (task A6); routes keep using req.user.user_id and need no change.
// While testing, send header `x-test-user: 2` to act as another user.
export function requireAuth(req, res, next) {
  req.user = { user_id: Number(req.headers['x-test-user']) || 1 };
  next();
}
