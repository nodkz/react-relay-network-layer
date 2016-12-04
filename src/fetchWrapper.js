/* eslint-disable no-use-before-define, no-else-return, prefer-const, no-param-reassign */

import createRequestError from './createRequestError';

function createWrappedResponse(response) {
  const res = response;

  // Wrap json() so it can be consumed multiple times by each middleware
  let jsonProm;
  res.json = () => {
    if (!jsonProm) {
      jsonProm = new Promise((resolve, reject) => {
        response.clone().json()
          .then(json => resolve(json))
          .catch(err => reject(err));
      });
    }
    return jsonProm;
  };

  return res;
}

export default function fetchWrapper(request, middlewares) {
  const fetchAfterAllWrappers = (req) => {
    let { url, ...opts } = req;

    if (!url) {
      if (req.relayReqType === 'batch-query') {
        url = '/graphql/batch';
      } else {
        url = '/graphql';
      }
    }

    return fetch(url, opts)
      .then(res => createWrappedResponse(res));
  };

  const wrappedFetch = compose(...middlewares)(fetchAfterAllWrappers);

  return wrappedFetch(request)
    .then(res => throwOnServerError(request, res))
    .then(res => res.json());
}


/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  } else {
    const last = funcs[funcs.length - 1];
    const rest = funcs.slice(0, -1);
    return (...args) => rest.reduceRight((composed, f) => f(composed), last(...args));
  }
}

function throwOnServerError(request, response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    return response.text().then(payload => {
      throw createRequestError(request.relayReqObj, request.relayReqType, response.status, payload);
    });
  }
}
