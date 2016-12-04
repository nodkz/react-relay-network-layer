/* eslint-disable prefer-template */

/*
 * Adapted from
 * https://github.com/facebook/relay/blob/8223d37b802b3890c8a387c47cba382d634f5c21/src/network-layer/default/RelayDefaultNetworkLayer.js#L199
 */

/**
 * Formats an error response from GraphQL server request.
 */
function formatRequestErrors(request, errors) {
  const CONTEXT_BEFORE = 20;
  const CONTEXT_LENGTH = 60;

  const queryLines = request.getQueryString().split('\n');
  return errors.map(({ locations, message }, ii) => {
    const prefix = `${ii + 1}. `;
    const indent = ' '.repeat(prefix.length);

    // custom errors thrown in graphql-server may not have locations
    const locationMessage = locations ?
      ('\n' + locations.map(({ column, line }) => {
        const queryLine = queryLines[line - 1];
        const offset = Math.min(column - 1, CONTEXT_BEFORE);
        return [
          queryLine.substr(column - 1 - offset, CONTEXT_LENGTH),
          `${' '.repeat(offset)}^^^`,
        ].map(messageLine => indent + messageLine).join('\n');
      }).join('\n')) :
      '';
    return prefix + message + locationMessage;
  }).join('\n');
}

export default function createRequestError(request, requestType, responseStatus, payload) {
  const debugName = Array.isArray(request) ?
    request.map(req => req.getDebugName()).join(' ') : request.getDebugName();
  const errorReason = typeof payload === 'object' ?
    formatRequestErrors(request, payload.errors) :
    `Server response had an error status: ${responseStatus}`;
  const error = new Error(
    `Server request for ${requestType} \`${debugName}\` ` +
    `failed for the following reasons:\n\n${errorReason}`
  );
  error.source = payload;
  error.status = responseStatus;
  return error;
}
