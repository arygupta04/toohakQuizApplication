
import { getData, setData, RegisterUserPush } from './dataStore';
import validator from 'validator';
import HTTPError from 'http-errors';
import {
  generateTokenID, getHashOf, isEmailUnique, isNameValid, checkSessionExists, isNameLengthShort, isNameLengthLong,
  checkTextLength
} from './helperFunctions';
import { UserDetailsResponse } from './dataStore';

/**
 * Registers a new administrator user with provided credentials.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} nameFirst - User's first name.
 * @param {string} nameLast - User's last name.
 *
 * @returns {Object} On success: { token: string }, on failure: { error: string }
 * Possible error messages:
 * - "Email is not valid"
 * - "Email already registered"
 * - "Name contains invalid characters or wrong length"
 * - "Password must contain at least one number and one letter and be at least 8 characters long"
 */

// Function that registers a user with an email, password, and names, then returns their authUserId value
export function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): {error?: string} | {token: string} {
  const data = getData();

  if (!validator.isEmail(email)) {
    return { error: 'Email is not valid' };
  }

  if (!isEmailUnique(data, email)) {
    return { error: 'Email already registered' };
  }

  if (!isNameValid(nameFirst)) {
    return { error: 'Firstname contains invalid characters' };
  }

  if (!isNameValid(nameLast)) {
    return { error: 'Lastname contains invalid characters' };
  }

  if (!isNameLengthShort(nameFirst)) {
    return { error: 'Firstname is too short' };
  }

  if (!isNameLengthLong(nameFirst)) {
    return { error: 'Firstname is too long' };
  }

  if (!isNameLengthShort(nameLast)) {
    return { error: 'Lastname is too short' };
  }

  if (!isNameLengthLong(nameLast)) {
    return { error: 'Lastname is too long' };
  }

  if (password.length < 8) {
    return { error: 'Password Less than 8 characters' };
  }

  // Checks if password contains at least one number and one letter
  const passowrdHasLetter = /[a-zA-Z]/.test(password);
  const passwordHasNumber = /\d/.test(password);
  if (!passowrdHasLetter || !passwordHasNumber) {
    return { error: 'Password must contain at least one number and one letter' };
  }

  const hashedPassword = getHashOf(password);
  const authUserId = data.users.length;

  const newUser: RegisterUserPush = {
    email: email,
    password: hashedPassword,
    name: `${nameFirst} ${nameLast}`,
    authUserId: authUserId,
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    sessions: [],
    quizTrash: []
  };

  // Pushes the user data to the dataStore.js
  data.users.push(newUser);

  const sessionId = generateTokenID();
  data.users[authUserId].sessions.push(sessionId);

  setData(data);

  return {
    token: sessionId
  };
}

/**
  *
  * @param {string} email - The email of a user for loggin in
  * @param {string} password - The user's password for their email
  * ---
  * @returns { authUserId } - If there are no errors
  * @returns {error: 'any error message'}
  * - Email address does not exist.
  * - Password is not correct for the given email.
*/

// Function that, given a registered user's email and password, returns their authUserId value
export function adminAuthLogin(email: string, password: string): {error?: string} | {token: string} {
  // Get the data from the data store
  const data = getData();

  // Loops through the data and checks if the email exists
  for (const user of data.users) {
    if (user.email === email) {
      const hashedInputPassword = getHashOf(password);
      if (user.password === hashedInputPassword) {
        user.numSuccessfulLogins += 1;
        user.numFailedPasswordsSinceLastLogin = 0;

        const sessionId = generateTokenID();
        user.sessions.push(sessionId);
        setData(data);

        return {
          token: sessionId
        };
      } else {
        user.numFailedPasswordsSinceLastLogin += 1;
        setData(data);
        // If the password is not correct, then it returns an error
        throw HTTPError(400, 'Password is incorrect for the given email');
      }
    }
  }

  throw HTTPError(400, 'Email does not exist');
}

/**
  *
  * @param {string} token - The token of a user for a specific logged in session
  * ---
  * @returns {} - If there are no errors
  * @returns {error: 'any error message'}
  * - Token is empty or invalid (does not refer to valid logged in user quiz session)
*/

export function adminAuthLogout(token: string): object | {error?: string} {
  const data = getData();
  let sessionFound = false;

  // Iterate over the list of users
  for (const user of data.users) {
    const newSessions = [];
    for (const session of user.sessions) {
      // Adds all sessions to the new list except for the one to invalidate
      if (session !== token) {
        newSessions.push(session);
      } else {
        sessionFound = true;
      }
    }
    user.sessions = newSessions;
  }

  // If the session was found
  if (sessionFound) {
    setData(data);
    // Returns an empty object if the token was found
    return {};
  } else {
    // throw Error('Token must be given and valid');
    throw HTTPError(401, 'Token must be given and valid');
  }
}

/**
  * @param {number} token - The authUserId is data.users.length of the user
  * ---
  * @returns { user: {
  *     userId,
  *     name,
  *     email,
  *     numSuccessfulLogins,
  *     numFailedPasswordsSinceLastLogin,
  *    }
  * } - If there are no errors
  *
  * @returns {error: 'error message'}
  * - AuthUserId is not a valid user
*/

// Function that fetches the user details by token
export function adminUserDetails(token: string): UserDetailsResponse | Error {
  const data = getData();

  for (const user of data.users) {
    if (user.sessions.includes(token)) {
      return {
        user: {
          userId: user.authUserId,
          name: user.name,
          email: user.email,
          numSuccessfulLogins: user.numSuccessfulLogins,
          numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
        }
      };
    }
  }
  throw HTTPError(401, 'AuthUserId is not a valid user');
}

/**
 * Function that given an admin user's authUserId/token, updates the properties of this logged in admin user
 *
 * @param {string} token - The unique authentication user ID.
 * @param {string} email - The updated email address.
 * @param {string} nameFirst - The updated first name.
 * @param {string} nameLast - The updated last name.
 *
 * @returns {Object} If there are no errors, returns an empty object.
 * @returns {error}-Throws an error message
 */
export function adminUserDetailsUpdate(token: string, email: string, nameFirst: string, nameLast: string): object | {error?: string} {
  // Gets the data
  const data = getData();

  // Throws an error if email is not valid
  if (!validator.isEmail(email)) {
    throw HTTPError(400, 'Email is not a valid email address');
  }

  // Calls isEmailUnique and throws an error if the email is being used by another user
  if (!isEmailUnique(data, email)) {
    throw HTTPError(400, 'Email address is used by another user');
  }

  const authUserId = checkSessionExists(token, data);

  // Throws an error if the token does not exist in any session
  if (authUserId === -1) {
    throw HTTPError(401, 'The following token does not exists');
  }

  // Calls isNameValid and checkTextLength and throws an error if first name is not valid
  if (!isNameValid(nameFirst) || !checkTextLength(nameFirst, 2, 20)) {
    throw HTTPError(400, 'First name is not valid');
  }

  // Calls isNameValid and checkTextLength and throws an error if last name is not valid
  if (!isNameValid(nameLast) || !checkTextLength(nameLast, 2, 20)) {
    throw HTTPError(400, 'Last name is not valid');
  }

  // Updates the user's properties
  const user = data.users.find(user => user.authUserId === authUserId);
  if (user) {
    user.email = email;
    user.name = `${nameFirst} ${nameLast}`;
  }

  // Sets the data
  setData(data);

  // Returns an empty object
  return {};
}

/**
  * Given the details relating to a password change, updates the password of a logged in user
  *
  * @param {string} token - The session ID of a user's unique login session
  * @param {string} oldPassword - The user's old password to be replaced by new password
  * @param {string} newPassword - The user's new password that replaces the old password
  * ...
  *
  * @returns {} - If there are no errors
  * @returns {error: 'specific error message here'} - Token is empty or invalid (does not refer to valid logged in user session)
  * - Old password is not correct old password
  * - Old Password and New Password match exactly
  * - New Password has already been used before by this user
  * - New Password is less than 8 characters
  * - New Password does not contain at least one number and at least one letter
*/

export function adminUserPasswordUpdate(token: string, oldPassword: string, newPassword: string): object | { error?: string } {
  // Get data from dataStore.js
  const data = getData();

  let user;
  let userIndex = -1;

  for (let i = 0; i < data.users.length; i++) {
    const dataUser = data.users[i];

    if (dataUser.sessions.length !== 0 && token != null) {
      if (dataUser.sessions.includes(token)) {
        user = dataUser;
        userIndex = i;
        break;
      }
    }
  }

  const authUserId = checkSessionExists(token, data);

  if (authUserId === -1) {
    throw HTTPError(401, 'Token is empty or invalid (does not refer to valid logged in user session');
  }

  const hashedOldPassword = getHashOf(oldPassword);
  const hashedNewPassword = getHashOf(newPassword);

  if (user.password !== hashedOldPassword) {
    throw HTTPError(400, 'Old password is not correct');
  }

  if (oldPassword === newPassword) {
    throw HTTPError(400, 'Old password and new password match exactly');
  }
  // initialize passwordHistory list for first time passwordUpdate is called
  if (!user.passwordHistory) {
    user.passwordHistory = [];
  }
  if (data.users[userIndex].passwordHistory.includes(hashedNewPassword)) {
    throw HTTPError(400, 'New password has already been used before by this user');
  }
  if (newPassword.length < 8) {
    throw HTTPError(400, 'New password is less than 8 characters');
  }
  if (!passwordIsValid(newPassword)) {
    throw HTTPError(400, 'New password does not contain at least one number and at least one letter');
  }

  data.users[userIndex].password = hashedNewPassword;
  data.users[userIndex].passwordHistory.push(hashedOldPassword);

  setData(data);

  return {};
}

function passwordIsValid(password: string) {
  return /\d/.test(password) && /[a-zA-Z]/.test(password);
}
