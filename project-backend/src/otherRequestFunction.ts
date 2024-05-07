import request from 'sync-request-curl';

import { port, url } from './config.json';
const SERVER_URL = `${url}:${port}`;

export const requestClear = () => {
  const res = request(
    'DELETE',
    SERVER_URL + '/v1/clear',
    {
      json: {} // Pass token as string directly
    }
  );

  return JSON.parse(res.body.toString());
};
