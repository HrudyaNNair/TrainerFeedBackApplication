import { test,expect } from '@playwright/test';

// test('TC-LOGIN-010: test to verify that the Login page loads successfully', async ({ page }) => {
//     await page.goto('http://127.0.0.1:5503/login.html')
// });
test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5503/login.html')
});
test('TC-LOGIN-011: test by title', async ({ page }) => {
    await page.getByTitle('Firebase Auth');
});
test('TC-LOGIN-012:test by text', async ({ page }) => {
        await page.getByText('Login');
    });
test('TC-LOGIN-013: test for email', async ({ page }) => {
    await page.getByRole('textbox', { name: "Email" }).first().click();
});
test('TC-LOGIN-014: test for password', async ({ page }) => {
    await page.getByPlaceholder('Password').first().click();
});
test('TC-LOGIN-015: test by rolebutton', async ({ page }) => {
    await page.getByRole('button', { name: "Login" }).click();
});

test('TC-LOGIN-016: Test Login',async ({ page }) => {
        await page.getByPlaceholder('Email').first().fill("hrudyannair@gmail.com")
        await page.getByPlaceholder('Password').first().fill("Hrudya@2001")
        await page.getByRole('button', { name: "Login" }).click();
    })
test('TC-LOGIN-017: Test Login with wrong email',async ({ page }) => {
        await page.getByPlaceholder('Email').first().fill("wronguser@gmail.com")
        await page.getByPlaceholder('Password').first().fill("Hrudya@2001")
        await page.getByRole('button', { name: "Login" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html');
    })
test('TC-LOGIN-018: Test Login with wrong password',async ({ page }) => {
        await page.getByPlaceholder('Email').first().fill("hrudyannair@gmail.com")
        await page.getByPlaceholder('Password').first().fill("WrongPass")
        await page.getByRole('button', { name: "Login" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html');
    })
test('TC-LOGIN-019: Test Login with wrong credentials',async ({ page }) => {
        await page.getByPlaceholder('Email').first().fill("fakeuser@gmail.com")
        await page.getByPlaceholder('Password').first().fill("WrongPass")
        await page.getByRole('button', { name: "Login" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html');
    })
test('TC-LOGIN-020: Test Login without credentials',async ({ page }) => {
        await page.getByRole('button', { name: "Login" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html');
    })
