import { assert } from 'chai';
import fetchMock from 'fetch-mock';
import { RelayNetworkLayer } from '../src';
import { mockReq } from './testutils';

describe('Mutation tests', () => {
  const middlewares = [];
  const rnl = new RelayNetworkLayer(middlewares);

  afterEach(() => {
    fetchMock.restore();
  });

  it('should make a successfull mutation', () => {
    fetchMock.post('/graphql', { data: {} });
    assert.isFulfilled(rnl.sendMutation(mockReq()));
  });

  it('should fail correctly on network failure', () => {
    fetchMock.mock({
      matcher: '/graphql',
      response: {
        throws: new Error('Network connection error'),
      },
      method: 'POST',
    });
    assert.isRejected(rnl.sendMutation(mockReq()), /Network connection error/);
  });

  it('should handle error response', () => {
    fetchMock.mock({
      matcher: '/graphql',
      response: {
        status: 200,
        body: {
          errors: [
            { location: 1, message: 'major error' },
          ],
        },
      },
      method: 'POST',
    });

    const req1 = mockReq(1);
    req1.reject = (err) => {
      assert(err instanceof Error, 'should be an error');
    };

    return rnl.sendMutation(req1);
  });

  it('should handle server non-2xx errors', () => {
    fetchMock.mock({
      matcher: '/graphql',

      response: {
        status: 500,
        body: {
          errors: [{
            message: 'Something went completely wrong.',
          }],
        },
      },
      method: 'POST',
    });

    const req1 = mockReq(1);
    req1.reject = (err) => {
      assert(err instanceof Error, 'should be an error');
      assert.equal(err.message, [
        'Server request for mutation `debugname1` failed for the following reasons:',
        '',
        'Server response had an error status: 500',
      ].join('\n'));
      assert.equal(err.status, 500);
      assert.equal(err.source, '{"errors":[{"message":"Something went completely wrong."}]}');
    };

    return rnl.sendMutation(req1);
  });
});
