/* eslint-disable no-param-reassign, prefer-template */

import createRequestError from '../createRequestError';

export function queryPre(relayRequest) {
  const req = {
    relayReqId: relayRequest.getID(),
    relayReqObj: relayRequest,
    relayReqType: 'query',
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
    },
  };

  req.body = JSON.stringify({
    query: relayRequest.getQueryString(),
    variables: relayRequest.getVariables(),
  });

  return req;
}


export function queryPost(relayRequest, fetchPromise) {
  return fetchPromise.then(payload => {
    if (payload.hasOwnProperty('errors')) {
      const error = createRequestError(relayRequest, 'query', '200', payload);
      relayRequest.reject(error);
    } else if (!payload.hasOwnProperty('data')) {
      relayRequest.reject(new Error(
        'Server response was missing for query `' + relayRequest.getDebugName() +
        '`.'
      ));
    } else {
      relayRequest.resolve({ response: payload.data });
    }
  }).catch(
    error => relayRequest.reject(error)
  );
}
