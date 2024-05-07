// Do not delete this file
import request from 'sync-request-curl';
import config from './config.json';

const port = config.port;
const url = config.url;

describe('HTTP tests using Jest', () => {
  test('Test successful echo', () => {
    const res = request(
      'GET',
            `${url}:${port}/echo`,
            {
              qs: {
                echo: 'Hello',
              },
              // adding a timeout will help you spot when your server hangs
              timeout: 100
            }
    );
    const bodyObj = JSON.parse(res.body as string);
    expect(bodyObj.value).toEqual('Hello');
  });
  test('Test invalid echo', () => {
    const res = request(
      'GET',
            `${url}:${port}/echo`,
            {
              qs: {
                echo: 'echo',
              },
              timeout: 100
            }
    );
    const bodyObj = JSON.parse(res.body as string);
    expect(bodyObj.error).toStrictEqual(expect.any(String));
  });
});
