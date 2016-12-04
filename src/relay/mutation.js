/* eslint-disable no-param-reassign, no-use-before-define, prefer-template */

import createRequestError from '../createRequestError';

export default function mutation(relayRequest, fetchWithMiddleware) {
  const req = {
    method: 'POST',
    relayReqId: Date.now(),
    relayReqObj: relayRequest,
    relayReqType: 'mutation',
  };

  if (_hasFiles(relayRequest)) {
    Object.assign(req, _mutationWithFiles(relayRequest));
  } else {
    Object.assign(req, _mutation(relayRequest));
  }

  return fetchWithMiddleware(req)
    .then(payload => {
      if (payload.hasOwnProperty('errors')) {
        const error = createRequestError(relayRequest, 'mutation', '200', payload);
        relayRequest.reject(error);
      } else {
        relayRequest.resolve({ response: payload.data });
      }
    }).catch(
      error => relayRequest.reject(error)
    );
}


function _hasFiles(relayRequest) {
  return !!(relayRequest.getFiles && relayRequest.getFiles());
}


function _mutationWithFiles(relayRequest) {
  const req = {
    headers: {},
  };

  if (_hasFiles(relayRequest)) {
    const files = relayRequest.getFiles();

    if (!global.FormData) {
      throw new Error('Uploading files without `FormData` not supported.');
    }
    const formData = new FormData();
    formData.append('query', relayRequest.getQueryString());
    formData.append('variables', JSON.stringify(relayRequest.getVariables()));
    Object.keys(files).forEach(filename => {
      formData.append(filename, files[filename]);
    });
    req.body = formData;
  }

  return req;
}


function _mutation(relayRequest) {
  const req = {
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
