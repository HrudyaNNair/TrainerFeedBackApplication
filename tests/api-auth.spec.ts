import { test, expect, request } from '@playwright/test';

test.describe('Firebase Auth API', () => {
  const base = 'https://identitytoolkit.googleapis.com/v1/accounts';
  const apiKey = 'AIzaSyDwWHsh_WJYgtUwR_BYvyMhZyW6srMWmCM';
  

  test('TC-FIREBASE-047: Signup with new user', async ({ request }) => {
    const response = await request.post(`${base}:signUp?key=${apiKey}`, {
      data: {
        email: `test3@gmail.com`,
        password: 'Test1234',
        returnSecureToken: true
      }
    });
    expect(response.status()).toBe(200)
  });
  test('TC-FIREBASE-048: Login fails with wrong password', async ({ request }) => {
    const response = await request.post(`${base}:signInWithPassword?key=${apiKey}`, {
      data: {
        email: 'existinguser@mail.com',
        password: 'WrongPass!',
        returnSecureToken: true
      }
    });
    expect(response.status()).toBe(400);

  });
  test('TC-FIREBASE-049: Login fails with correct password', async ({ request }) => {
    const response = await request.post(`${base}:signInWithPassword?key=${apiKey}`, {
      data: {
        email: 'hrudyannair@gmail.com',
        password: 'Hrudya@2001',
        returnSecureToken: true
      }
    });
    expect(response.status()).toBe(200);

  });
  
})
