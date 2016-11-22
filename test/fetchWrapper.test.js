import { assert } from 'chai';
import fetchMock from 'fetch-mock';
import fetchWrapper from '../src/fetchWrapper';
import { mockReq as mockRelayReq } from './testutils';

function createMockReq() {
  const relayRequest = mockRelayReq();
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

function createMockMiddlware() {
  return next => req => {
    return next(req).then(res => {
      return res.json()
        .then(() => {
          return res;
        })
        .catch(() => {
          return res;
        });
    });
  };
}

describe('fetchWrapper', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  describe('with no middleware', () => {
    it('should make a successfull request', () => {
      fetchMock.post('/graphql', { data: {} });
      assert.isFulfilled(fetchWrapper(createMockReq(), []));
    });
  });

  describe('with middlewares each consuming `response.json()`', () => {
    const middlewares = [
      createMockMiddlware(),
      createMockMiddlware(),
    ];

    it('should make a successfull request', () => {
      fetchMock.post('/graphql', { data: {} });
      assert.isFulfilled(fetchWrapper(createMockReq(), middlewares));
    });
  });
});
