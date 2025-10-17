import { test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5503/login.html')
});

test('test by rolebutton', async ({ page }) => {
    await page.getByRole('button', { name: "Login" }).click();
});
test('test by placeholder', async ({ page }) => {
    await page.getByPlaceholder('Password').first().click();
});
test('test by role', async ({ page }) => {
    await page.getByRole('textbox', { name: "Email" }).first().click();
});
test('test by title', async ({ page }) => {
    await page.getByTitle('Firebase Auth');
});
test.describe('Suite 1', () => {
    test.beforeEach(async ({ page }) => {
        await page.getByPlaceholder('Email').first().fill("hrudyannair@gmail.com")
        await page.getByPlaceholder('Password').first().fill("Hrudya@2001")
        await page.getByRole('button', { name: "Login" }).click();
    })
    test('test by Label', async ({ page }) => {
        // await page.getByLabel('Upload Excel File').click();
        await page.getByLabel('Upload Excel File').setInputFiles(
            'D:/ILP2025_01_SDET_WS_16082025/JSUsecase/ILP - Tech Fundamentals _ Final Feedback _ 2024-25 Batch(1-24) (1) (Use Case).xlsx'
        );
        await page.locator('#uploadBtn').click();
    });
    test('test by text', async ({ page }) => {
        await page.getByText('Feedback Report Generator').click();
    });

})

