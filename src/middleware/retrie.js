/* eslint-disable no-console */

export default function retrieMiddleware(opts = {}) {
  const fetchTimeout = opts.fetchTimeout || 15000;
  const retryDelays = opts.retryDelays || [1000, 3000];

  return next => req => {
    req.fetchTimeout = fetchTimeout;
    req.retryDelays = retryDelays;

    return next(req); // re-run query with new token
  };
}
