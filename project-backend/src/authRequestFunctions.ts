import request from 'sync-request-curl';

import { port, url } from './config.json';
const SERVER_URL = `${url}:${port}`;

// Initiates a POST request to the admin authentication registration endpoint
// The function registers a new user by sending their details to the server
export const requestAdminAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/register',
    {
      json: { email, password, nameFirst, nameLast },
      timeout: 100
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminAuthLogin = (email: string, password: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/login',
    {
      json: { email, password },
      timeout: 100
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminAuthLogout = (token: string) => {
  const res = request(
    'POST',
    SERVER_URL + '/v2/admin/auth/logout',
    {
      headers: { token },
      timeout: 100
    }
  );
  return JSON.parse(res.body.toString());
};

export const requestAdminUserDetails = (token: string) => {
  const res = request(
    'GET',
    SERVER_URL + '/v2/admin/user/details',
    {
      headers: { token },
      timeout: 100
    }
  );
  return JSON.parse(res.body.toString());
};

// Implementation of a helper function for adminUserDetailsUpdate
export const requestAdminUserDetailsUpdate = (token: string, email: string, nameFirst: string, nameLast: string) => {
  const res = request(
    'PUT',
    SERVER_URL + '/v2/admin/user/details',
    {
      headers: { token },
      json: { email, nameFirst, nameLast }
    }
  );
  return JSON.parse(res.body.toString());
};

// Initiates a PUT request to the admin password update endpoint
// The function, given details relating to a password change, updates the password of a logged in user by sending their details to the server
export const requestUpdatePassword = (token: string, oldPassword: string, newPassword: string): string => {
  const res = request(
    'PUT',
    SERVER_URL + '/v2/admin/user/password',
    {
      headers: { token },
      json: {
        oldPassword: oldPassword,
        newPassword: newPassword
      },
      timeout: 100
    }
  );
  return JSON.parse(res.body.toString());
};
