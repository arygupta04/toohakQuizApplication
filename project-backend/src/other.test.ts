import { requestAdminAuthRegister } from './authRequestFunctions';
import { requestAdminQuizCreate, requestAdminQuizInfo } from './quizRequestFunctions';
import { requestClear } from './otherRequestFunction';

describe('Clear function', () => {
  test('Checks if clear returns empty object', () => {
    const result1 = requestAdminAuthRegister('vedantCCCCCC@gmail.com', 'T9iu9poiu', 'Ved', 'Khan');
    const result2 = requestAdminAuthRegister('gogooogagaaamentality@gmail.com', 'G00Googaga2', 'Gogis', 'George');

    requestAdminQuizCreate(result1.token, 'vedants quiz', 'this is the best quiz bro');
    requestAdminQuizCreate(result2.token, 'baddd quiz', 'wosrt quiz ever bro ifukwim');

    expect(requestClear()).toStrictEqual({});
  });

  test('Checks if clear deleted users', () => {
    requestAdminAuthRegister('vedantCCCCCC@gmail.com', 'T9iu9poiu', 'Ved', 'Khan');
    requestAdminAuthRegister('gogooogagaaamentality@gmail.com', 'G00Googaga2', 'Gogis', 'George');

    expect(requestClear()).toStrictEqual({});

    const result3 = requestAdminAuthRegister('vedantCCCCCC@gmail.com', 'T9iu9poiu', 'Ved', 'Khan');
    const result4 = requestAdminAuthRegister('gogooogagaaamentality@gmail.com', 'G00Googaga2', 'Gogis',
      'George');
    requestClear();
    const quizId1 = requestAdminQuizCreate(result3.token, 'vedants', 'this is the best quiz bro');
    const quizId2 = requestAdminQuizCreate(result4.token, 'baddd', 'wosrt quiz ever bro ifukwim');

    expect(quizId1).toStrictEqual({ error: 'The following token does not exists.' });
    expect(quizId2).toStrictEqual({ error: 'The following token does not exists.' });
  });

  test('Checks if clear deleted quizzes', () => {
    requestAdminAuthRegister('vedantCCCCCC@gmail.com', 'T9iu9poiu', 'Ved', 'Khan');
    requestAdminAuthRegister('gogooogagaaamentality@gmail.com', 'G00Googaga2', 'Gogis', 'George');

    expect(requestClear()).toStrictEqual({});

    const result3 = requestAdminAuthRegister('vedantCCCCCC@gmail.com', 'T9iu9poiu', 'Ved', 'Khan');
    const result4 = requestAdminAuthRegister('gogooogagaaamentality@gmail.com', 'G00Googaga2', 'Gogis', 'George');

    const quizId1 = requestAdminQuizCreate(result3.token, 'vedants', 'this is the best quiz bro');
    const quizId2 = requestAdminQuizCreate(result4.token, 'baddd', 'wosrt quiz ever bro ifukwim');

    requestClear();

    expect(requestAdminQuizInfo(result3.token, quizId1.quizId)).toStrictEqual({ error: 'The following token does not exists' });
    expect(requestAdminQuizInfo(result4.token, quizId2.quizId)).toStrictEqual({ error: 'The following token does not exists' });
  });
});
