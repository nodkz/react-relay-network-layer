/* eslint-disable no-console */
import 'whatwg-fetch';

export default function retrieMiddleware(opts = {}) {
  /*
   const fetchTimeout = opts.fetchTimeout || 15000;
   const retryDelays = opts.retryDelays || [1000, 3000];
   */

  return next => req => {
    const test = req;
    // console.log( `first ${req.relayReqType} ${req.relayReqId}`);
    return next(req).then(res => {
      // console.log('second',req, test);
      const request = fetch('/graphql', req);

      return request.then((response) => {
        return response;
      });
    });
  };
}
