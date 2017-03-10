import { queryPost } from './_query';

function buildRelayRequest(relayRequestList) {
  const requestMap = {};

  relayRequestList.forEach((req) => {
    const reqId = req.getID();
    requestMap[reqId] = req;
  });

  const req = {
    relayReqId: `BATCH_QUERY:${Object.keys(requestMap).join(':')}`,
    relayReqObj: relayRequestList,
    relayReqType: 'batch-query',
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
    },
  };

  req.body = JSON.stringify(
    Object.keys(requestMap).map((id) => ({
      id,
      query: requestMap[id].getQueryString(),
      variables: requestMap[id].getVariables(),
    }))
  );

  return {
    req,
    requestMap,
  };
}

function chunkBatchedRequests(relayRequestList, maxBatchSize) {
  const masterRequestMap = {};
  const chunks = [];

  while (relayRequestList.length) {
    chunks.push(relayRequestList.splice(0, maxBatchSize));
  }

  const requests = chunks.map(chunk => {
    const { requestMap, req } = buildRelayRequest(chunk);
    Object.assign(masterRequestMap, requestMap);
    return req;
  });

  return {
    requests,
    requestMap: masterRequestMap,
  };
}

function resolveBatchedQueries(fetchWithMiddleware, relayRequestList, requests, requestMap) {
  return Promise.all(requests.map(req => fetchWithMiddleware(req)))
    .then(batchResponses => {
      [].concat(...batchResponses).forEach((res) => {
        if (!res) return;
        const relayRequest = requestMap[res.id];

        if (relayRequest) {
          queryPost(
            relayRequest,
            new Promise(resolve => {
              if (res.payload) {
                resolve(res.payload);
                return;
              }
              // compatibility with graphene-django and apollo-server batch format
              resolve(res);
            })
          );
        }
      });
    })
    .catch(e => {
      return Promise.all(relayRequestList.map(relayRequest => {
        return relayRequest.reject(e);
      }));
    });
}

export default function queriesBatch(relayRequestList, fetchWithMiddleware, options) {
  const maxBatchSize = options && options.maxBatchSize;
  if (!maxBatchSize) {
    const { req, requestMap } = buildRelayRequest(relayRequestList);
    return resolveBatchedQueries(fetchWithMiddleware, relayRequestList, [req], requestMap);
  }
  const { requests, requestMap } = chunkBatchedRequests(relayRequestList, options.maxBatchSize);
  return resolveBatchedQueries(fetchWithMiddleware, relayRequestList, requests, requestMap);
}
