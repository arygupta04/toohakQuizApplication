// Do not delete this file
import { echo } from './echo';

test('Test successful echo', () => {
  let result = echo({ echo: '1' }); // Pass an object with the required structure
  expect(result).toStrictEqual({ echo: '1' });
  result = echo({ echo: 'abc' }); // Pass an object with the required structure
  expect(result).toStrictEqual({ echo: 'abc' });
});

test('Test invalid echo', () => {
  const result = echo({ echo: 'echo' }); // Pass an object with the required structure
  expect(result).toMatchObject({ error: expect.any(String) });
});
