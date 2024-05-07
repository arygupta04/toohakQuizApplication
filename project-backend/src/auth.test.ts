import { requestClear } from './otherRequestFunction';
import { getData } from './dataStore';
import {
  requestAdminAuthRegister, requestAdminAuthLogin, requestAdminAuthLogout, requestAdminUserDetails,
  requestUpdatePassword, requestAdminUserDetailsUpdate
} from './authRequestFunctions';

beforeEach(() => {
  requestClear();
});

// Testing for adminAuthRegister
describe('adminAuthRegister', () => {
  test('Checks for successful registration', () => {
    const authUserId = requestAdminAuthRegister('ZeeeeeeVeeee@hotpotdot.com', '1234abc@#$', 'Zeeeeee', 'Veeee');
    expect(authUserId).toStrictEqual({
      token: expect.any(String)
    });
  });

  test('Checks for duplicate email', () => {
    requestAdminAuthRegister('ZeeeeeeVeeee@hotpotdot.com', '1234abc@#$', 'Zeeeeee', 'Veeee');
    const authUserId2 = requestAdminAuthRegister('ZeeeeeeVeeee@hotpotdot.com', '1234abc!@#$', 'Zeeeeee', 'Veeee');
    expect(authUserId2).toStrictEqual({ error: 'Email already registered' });
  });

  test('Checks for fail on short passwords', () => {
    const passwords = ['', '1', '1a', '12a', '12ab', '123ab', '123abc', '1234abc'];
    passwords.forEach(password => {
      const authUserId = requestAdminAuthRegister(`test${password.length}@hotpotdot.com`, password, 'Zeeeeee', 'Veeee');
      expect(authUserId).toStrictEqual({ error: 'Password Less than 8 characters' });
    });
  });

  test('Checks if Email validates', () => {
    const emails = [
      'test1@@hotpotdot.com', 'test1hotpotdot.com', 'test1@hotpotdotcom', '.test1@hotpotdot.com',
      'test1@hotpotdot..com', 'test1@hotpotdot.c', '<test1@hotpotdot.com>', '"test1@hotpotdot".com',
      'test1 @hotpotdot.com'
    ];
    emails.forEach(email => {
      const authUserId = requestAdminAuthRegister(email, '1234abcd!@#$', 'Zeeeeee', 'Veeee');
      expect(authUserId).toStrictEqual({ error: 'Email is not valid' });
    });
  });

  test('Checks if NameFirst is too short', () => {
    const shortNames = ['', 'Z'];
    shortNames.forEach(name => {
      const authUserId = requestAdminAuthRegister('test@hotpotdot.com', '1234abc!@#$', name, 'Veeee');
      expect(authUserId).toStrictEqual({ error: 'Firstname is too short' });
    });
  });

  test('Checks if NameFirst is too long', () => {
    const longNames = ['ZeeeeZeeeeZeeeeZeeeeZ', 'ZeeeeZeeeeZeeeeZeeeeZe'];
    longNames.forEach(name => {
      const authUserId = requestAdminAuthRegister('test@hotpotdot.com', '1234abc!@#$', name, 'Veeee');
      expect(authUserId).toStrictEqual({ error: 'Firstname is too long' });
    });
  });

  test('Checks if NameFirst contains invalid characters', () => {
    // Define an array of first names that include invalid characters
    const invalidNames = [
      'Zeeeeee$', 'Zeeeeee@', 'Zee/eee', 'Zeeeeee*', 'Zee+eee',
      'Zee?eee', 'Zeeeeee:', 'Zee=eee', 'Zeeeeee~', 'Zeeeeee<',
      'Zeeeeee>', 'Zeeeeee.', 'Zeeeeee!', 'Zeeeeee#', 'Zeeeeee%',
      'Zeeeeee^', 'Zeeeeee(', 'Zeeeeee)', 'Zeeeeee_', 'Zeeeeee[',
      'Zeeeeee]', 'Zeeeeee{', 'Zeeeeee}'
    ];

    // Loop through each invalid first name and check for the expected error
    invalidNames.forEach(name => {
      const authUserId = requestAdminAuthRegister('test@hotpotdot.com', '1234abc!@#$', name, 'Veeee');
      expect(authUserId).toStrictEqual({ error: 'Firstname contains invalid characters' });
    });
  });

  test('Checks if NameLast is too short', () => {
    const shortNames = ['', 'V'];
    shortNames.forEach(name => {
      const authUserId = requestAdminAuthRegister('test@hotpotdot.com', '1234abc!@#$', 'Zeeeeee', name);
      expect(authUserId).toStrictEqual({ error: 'Lastname is too short' });
    });
  });

  test('Checks if NameLast is too long', () => {
    const longNames = ['VeeeeVeeeeVeeeeVeeeeV', 'VeeeeVeeeeVeeeeVeeeeVe'];
    longNames.forEach(name => {
      const authUserId = requestAdminAuthRegister('test@hotpotdot.com', '1234abc!@#$', 'Zeeeeee', name);
      expect(authUserId).toStrictEqual({ error: 'Lastname is too long' });
    });
  });

  test('Checks if NameLast contains invalid characters', () => {
    // Define an array of last names that include invalid characters
    const invalidNames = [
      'Veeeeee$', 'Veeeeee@', 'Vee/eee', 'Veeeeee*', 'Vee+eee',
      'Vee?eee', 'Veeeeee:', 'Vee=eee', 'Veeeeee~', 'Veeeeee<',
      'Veeeeee>', 'Veeeeee.', 'Veeeeee!', 'Veeeeee#', 'Veeeeee%',
      'Veeeeee^', 'Veeeeee(', 'Veeeeee)', 'Veeeeee_', 'Veeeeee[',
      'Veeeeee]', 'Veeeeee{', 'Veeeeee}'
    ];

    // Loop through each invalid last name and check for the expected error
    invalidNames.forEach(name => {
      const authUserId = requestAdminAuthRegister('test@hotpotdot.com', '1234abc!@#$', 'Zeeeeee', name);
      expect(authUserId).toStrictEqual({ error: 'Lastname contains invalid characters' });
    });
  });

  test('Checks if password contains at least one number and at least one letter', () => {
    const authUserId1 = requestAdminAuthRegister('testp1@hotpotdot.com', '1234abcd', 'Zeeeeee', 'Veeee');
    expect(authUserId1.error).toBeUndefined();

    const authUserId2 = requestAdminAuthRegister('testp2@hotpotdot.com', '123456789', 'Zeeeeee', 'Veeee');
    expect(authUserId2).toStrictEqual({ error: 'Password must contain at least one number and one letter' });

    const authUserId3 = requestAdminAuthRegister('testp3@hotpotdot.com', 'abcdabcd', 'Zeeeeee', 'Veeee');
    expect(authUserId3).toStrictEqual({ error: 'Password must contain at least one number and one letter' });
  });
});

describe('adminAuthLogin', () => {
  test('Checks for successful login', () => {
    const register = requestAdminAuthRegister('successfulllogin@hotpotdot.com', '1234abc@#$', 'Zeeeeee', 'Veeee');
    const login = requestAdminAuthLogin('successfulllogin@hotpotdot.com', '1234abc@#$');
    expect(register.authUserId).toBe(login.authUserId);
  });

  test('Checks if email exists', () => {
    const authUserId1 = requestAdminAuthLogin('doesnotexist@hotpotdot.com', '1234abc@#$');
    expect(authUserId1).toStrictEqual({ error: 'Email does not exist' });
  });

  test('Password not correct for given email', () => {
    requestAdminAuthRegister('correctpasswordtest@hotpotdot.com', 'CorrectPass123', 'TestName', 'TestLast');
    const authUserId2 = requestAdminAuthLogin('correctpasswordtest@hotpotdot.com', 'WrongPass123');
    expect(authUserId2).toStrictEqual({ error: 'Password is incorrect for the given email' });
  });

  test('Successful login increments numSuccessfulLogins', () => {
    requestAdminAuthRegister('incrementlogin@hotpotdot.com', 'incrementPass123', 'NameIncrement', 'LastIncrement');
    requestAdminAuthLogin('incrementlogin@hotpotdot.com', 'incrementPass123');

    const data = getData();
    for (const user of data.users) {
      if (user.email === 'incrementlogin@hotpotdot.com') {
        expect(user.numSuccessfulLogins).toBe(2);
        expect(user.numFailedPasswordsSinceLastLogin).toBe(0);
      }
    }
  });
});

// Testing for adminAuthLogout
describe('adminAuthLogout', () => {
  test('Successful logout after register', () => {
    const register = requestAdminAuthRegister('logout1@hotpotdot.com', 'incrementPass123', 'NameIncrement', 'LastIncrement');
    const logout = requestAdminAuthLogout(register.token);
    expect(logout).toStrictEqual({});
  });

  test('Successful logout after one login', () => {
    requestAdminAuthRegister('logout2@hotpotdot.com', 'incrementPass123', 'NameIncrement', 'LastIncrement');
    const login = requestAdminAuthLogin('logout2@hotpotdot.com', 'incrementPass123');
    const logout = requestAdminAuthLogout(login.token);
    expect(logout).toStrictEqual({});
  });

  test('Successful logout specific login when multiple login sessions are active', () => {
    requestAdminAuthRegister('logout3@hotpotdot.com', 'incrementPass123', 'NameIncrement', 'LastIncrement');
    const login1 = requestAdminAuthLogin('logout3@hotpotdot.com', 'incrementPass123');
    const login2 = requestAdminAuthLogin('logout3@hotpotdot.com', 'incrementPass123');
    const logout1 = requestAdminAuthLogout(login1.token);
    const logout2 = requestAdminUserDetails(login2.token);
    const expectedUserId = logout2.user.userId;
    expect(logout1).toStrictEqual({});

    expect(logout2.user).toEqual({
      userId: expectedUserId,
      name: logout2.user.name,
      email: logout2.user.email,
      numSuccessfulLogins: logout2.user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: logout2.user.numFailedPasswordsSinceLastLogin,
    });
  });

  test('logout failed when invalid token given', () => {
    requestAdminAuthRegister('logout4@hotpotdot.com', 'incrementPass123', 'NameIncrement', 'LastIncrement');
    const login = requestAdminAuthLogin('logout4@hotpotdot.com', 'incrementPass123');
    const logout = requestAdminAuthLogout(login.token + 1);
    expect(logout).toStrictEqual({ error: 'Token must be given and valid' });
  });
});

// Testing for adminUserDetails
describe('adminUserDetails', () => {
  test('Check if token exists', () => {
    const registerResponse = requestAdminAuthRegister('userdetails@hotpotdot.com', '1234abcD@#$', 'FirstName', 'LastName');
    const userDetailsResponse = requestAdminUserDetails(registerResponse.token);

    const expectedUserId = userDetailsResponse.user.userId;

    expect(userDetailsResponse.user).toEqual({
      userId: expectedUserId,
      name: 'FirstName LastName',
      email: 'userdetails@hotpotdot.com',
      numSuccessfulLogins: userDetailsResponse.user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: userDetailsResponse.user.numFailedPasswordsSinceLastLogin,
    });
  });

  test('token is not valid', () => {
    const authUserId = requestAdminUserDetails('-1');
    expect(authUserId).toStrictEqual({ error: 'AuthUserId is not a valid user' });

    const authUserId2 = requestAdminUserDetails('-2');
    expect(authUserId2).toStrictEqual({ error: 'AuthUserId is not a valid user' });
  });

  test('Check failed login', () => {
    const registerResponse = requestAdminAuthRegister('reset@hotpotdot.com', 'Correct1$', 'Zeeeeee', 'Veeeeee');

    requestAdminAuthLogin('reset@hotpotdot.com', 'nooope1');
    requestAdminAuthLogin('reset@hotpotdot.com', 'nooope2');

    const userDetailsResponse = requestAdminUserDetails(registerResponse.token);

    expect(userDetailsResponse.user.numSuccessfulLogins).toBe(1);
    expect(userDetailsResponse.user.numFailedPasswordsSinceLastLogin).toBe(2);
  });

  test('Check successful login', () => {
    const registerResponse = requestAdminAuthRegister('resetcorrect@hotpotdot.com', 'Correct1$', 'Zeeeeee', 'Veeeeee');

    requestAdminAuthLogin('resetcorrect@hotpotdot.com', 'Correct1$');

    const userDetailsResponse = requestAdminUserDetails(registerResponse.token);

    expect(userDetailsResponse.user.numSuccessfulLogins).toBe(2);
    expect(userDetailsResponse.user.numFailedPasswordsSinceLastLogin).toBe(0);
  });
});

// Testing for adminUserDetailsUpdate
describe('adminUserDetailsUpdate', () => {
  test('Successfully updates user details', () => {
    const originalUser = requestAdminAuthRegister('update@example.com', 'Password123!', 'Original', 'User');
    const result = requestAdminUserDetailsUpdate(originalUser.token, 'newemail@example.com', 'NewFirst', 'NewLast');
    expect(result).toStrictEqual({});
  });

  test('Checks for token validity', () => {
    const result = requestAdminUserDetailsUpdate('-1', 'newemail@example.com', 'NewFirst', 'NewLast');
    expect(result).toStrictEqual({ error: 'The following token does not exists' });
  });

  test('Checks for email validity', () => {
    const originalUser = requestAdminAuthRegister('update@example.com', 'Password123!', 'Original', 'User');
    const invalidEmails = ['invalidemail', 'another@invalid', 'yetanotherinvalid@', 'lastinvalid.com', 'email@@example.com'];
    invalidEmails.forEach(email => {
      const result = requestAdminUserDetailsUpdate(originalUser.token, email, 'Invalid', 'User');
      expect(result).toStrictEqual({ error: 'Email is not a valid email address' });
    });
  });

  test('Checks if email is already in use', () => {
    const originalUser = requestAdminAuthRegister('my@example.com', 'Password123!', 'Original', 'User');
    requestAdminAuthRegister('user1@example.com', 'Password123!', 'User', 'One');
    const result = requestAdminUserDetailsUpdate(originalUser.token, 'user1@example.com', 'User', 'Two');
    expect(result).toStrictEqual({ error: 'Email address is used by another user' });
  });

  test('Checks if first name is invalid', () => {
    const originalUser = requestAdminAuthRegister('update@example.com', 'Password123!', 'Original', 'User');
    const invalidNames = ['', 'X', '@san', 'ThisNameIsDefinitelyTooLongForTheSystemToHandle'];
    invalidNames.forEach(firstName => {
      const result = requestAdminUserDetailsUpdate(originalUser.token, 'invaliduser@example.com', firstName, 'User');
      expect(result).toStrictEqual({ error: 'First name is not valid' });
    });
  });

  test('Checks if last name is invalid', () => {
    const originalUser = requestAdminAuthRegister('update@example.com', 'Password123!', 'Original', 'User');
    const invalidNames = ['', 'Y', '2resan', 'ThisLastNameIsAlsoDefinitelyTooLongForTheSystemToHandle'];
    invalidNames.forEach(lastName => {
      const result = requestAdminUserDetailsUpdate(originalUser.token, 'validuser@example.com', 'Valid', lastName);
      expect(result).toStrictEqual({ error: 'Last name is not valid' });
    });
  });
});

// Testing for adminUserPasswordUpdate
describe('adminUserPasswordUpdate', () => {
  test('Checks if token is empty', () => {
    expect(requestUpdatePassword(null, 'OldPass99', 'NewPass99')).toStrictEqual({ error: 'Token is empty or invalid (does not refer to valid logged in user session' });
  });

  test('Checks if token is invalid (does not refer to a valid logged in user session)', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    expect(requestUpdatePassword(user.token + 1, 'OldPass99', 'NewPass99')).toStrictEqual({ error: 'Token is empty or invalid (does not refer to valid logged in user session' });
  });

  test('Checks if token is invalid, no users are created, so no tokens passed in are valid', () => {
    expect(requestUpdatePassword('3', 'OldPass99', 'NewPass99')).toStrictEqual({ error: 'Token is empty or invalid (does not refer to valid logged in user session' });
  });

  test('Checks if old password is not correct', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    expect(requestUpdatePassword(user.token, 'WrongPassword', 'NewPass99')).toStrictEqual({ error: 'Old password is not correct' });
  });

  test('Checks if old password and new password match exactly', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    expect(requestUpdatePassword(user.token, 'OldPass99', 'OldPass99')).toStrictEqual({ error: 'Old password and new password match exactly' });
  });

  test('Checks if new password has already been used before by this user', () => {
    const user = requestAdminAuthRegister('email2@gmail.com', 'OldPass99', 'Nick', 'Ta');
    // change to new password
    expect(requestUpdatePassword(user.token, 'OldPass99', 'NewPass99')).toStrictEqual(
      {}
    );
    // try to update to used password
    expect(requestUpdatePassword(user.token, 'NewPass99', 'OldPass99')).toStrictEqual({ error: 'New password has already been used before by this user' });
  });

  test('Checks if new password is less than 8 characters', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    expect(requestUpdatePassword(user.token, 'OldPass99', 'Short<8')).toStrictEqual({ error: 'New password is less than 8 characters' });
  });

  test.each([

    { password: 'NoNumber' },
    { password: '123456789' },
    { password: '~!@#$%^&*()_+' },

  ])("Checks if new passowrd is invalid: '$password'", ({ password }) => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    expect(requestUpdatePassword(user.token, 'OldPass99', password)).toStrictEqual({ error: 'New password does not contain at least one number and at least one letter' });
  });

  test('Checks if old password is correct and new password is valid, and if new password is set correctly', () => {
    const user = requestAdminAuthRegister('email@gmail.com', 'OldPass99', 'Nick', 'Ta');
    // checks for correct return type
    expect(requestUpdatePassword(user.token, 'OldPass99', 'NewPass99')).toStrictEqual(
      {}
    );
    // checks if password is updated correctly; if 'OldPass99' is used to try to update password again, it won't work
    expect(requestUpdatePassword(user.token, 'OldPass99', 'UnusedPassword')).toStrictEqual({ error: 'Old password is not correct' });
    expect(requestUpdatePassword(user.token, 'NewPass99', 'NewNewPass99')).toStrictEqual({});
  });
});
