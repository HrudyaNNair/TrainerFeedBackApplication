import { test,expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5503/login.html')
    await page.locator('#showSignup').click();
});
test('TC-SIGNUP-001: test by Sign Up', async ({ page }) => {
    await page.getByText('Sign Up');
});
test('TC-SIGNUP-002: test by email', async ({ page }) => {
    await page.getByRole('textbox', { name: "Email" }).click();
});
test('TC-SIGNUP-003: test for password', async ({ page }) => {
    await page.locator('#signupPassword').click();
});
test('TC-SIGNUP-004: test by rolebutton', async ({ page }) => {
    await page.getByRole('button', { name: "Sign Up" }).click();
});

test.describe('Suite 1', () => {
    test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5503/login.html')
    await page.locator('#showSignup').click();
});
    test('TC-SIGNUP-005: Test Sign Up',async ({ page }) => {
        await page.locator('#signupEmail').fill("hrudya@gmail.com")
        await page.locator('#signupPassword').fill("Hrudya")
        await page.getByRole('button', { name: "Sign Up" }).click();
    })
})
test.describe('Suite 2', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5503/login.html')
        await page.locator('#showSignup').click();
    });
    test('TC-SIGNUP-006: Test to Sign Up without credentials', async ({ page }) => {
        await page.getByRole('button', { name: "Sign Up" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html#');
    });
})
test.describe('Suite 3', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5503/login.html')
        await page.locator('#showSignup').click();
    });
    test('TC-SIGNUP-007: Test to Sign Up with already registered credentials', async ({ page }) => {
        await page.locator('#signupEmail').fill("hrudya@gmail.com")
        await page.locator('#signupPassword').fill("Hrudya")
        await page.getByRole('button', { name: "Sign Up" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html#');
    });
})
test.describe('Suite 4', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5503/login.html')
        await page.locator('#showSignup').click();
    });
    test('TC-SIGNUP-009: Test to Sign Up with 5 character password', async ({ page }) => {
        await page.locator('#signupEmail').fill("testuser@gmail.com")
        await page.locator('#signupPassword').fill("12345")
        await page.getByRole('button', { name: "Sign Up" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html#');
    });
})
test.describe('Suite 4', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5503/login.html')
        await page.locator('#showSignup').click();
    });
    test('TC-SIGNUP-009: Test to Sign Up with invalid email format', async ({ page }) => {
        await page.locator('#signupEmail').fill(" testuser.com")
        await page.locator('#signupPassword').fill("Hrudya")
        await page.getByRole('button', { name: "Sign Up" }).click();
        await expect(page).toHaveURL('http://127.0.0.1:5503/login.html#');
    });
})
