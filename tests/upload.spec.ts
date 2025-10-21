import { test,expect } from '@playwright/test';


test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5503/login.html')
});


test.describe('Suite 1', () => {
    test.beforeEach(async ({ page }) => {
        await page.getByPlaceholder('Email').first().fill("hrudyannair@gmail.com")
        await page.getByPlaceholder('Password').first().fill("Hrudya@2001")
        await page.getByRole('button', { name: "Login" }).click();
    })
    test('TC-UPLOAD-021: test by title', async ({ page }) => {
        await page.getByTitle('Feedback System');
    });

    test('TC-UPLOAD-022: test by text', async ({ page }) => {
        await page.getByText('Feedback Report Generator').click();
    });
    test('TC-UPLOAD-023: test by Label', async ({ page }) => {
        await page.getByLabel('Upload Excel File');
    });
    test('TC-UPLOAD-024: test to check if file can be uploaded', async ({ page }) => {
        await page.locator('#fileInput').click();
    });
    test('TC-UPLOAD-025: test to check if upload button is working', async ({ page }) => {
        await page.locator('#uploadBtn').click();

    });
    test('TC-UPLOAD-026: test to check if logout button is working', async ({ page }) => {
        await page.locator('#logoutBtn').click();

    });
    test('TC-UPLOAD-027 : test to upload', async ({ page }) => {
        
        await page.getByLabel('Upload Excel File').setInputFiles(
            'D:/ILP2025_01_SDET_WS_16082025/JSUsecase/ILP - Tech Fundamentals _ Final Feedback _ 2024-25 Batch(1-24) (1) (Use Case).xlsx'
        );
        await page.locator('#uploadBtn').click();
    });
    test('TC-UPLOAD-028:test to upload wrong file type (PDF)', async ({ page }) => {
    await page.getByLabel('Upload Excel File').setInputFiles(
        'C:/Users/hrudya.nair/Downloads/Typescript.pdf'
    );
    await page.locator('#uploadBtn').click();

    await expect(page.locator('.error-message')).toHaveText(
        'Only .xlsx files are allowed'
    );
})
test('TC-UPLOAD-029: test to upload without selecting a file', async ({ page }) => {
    await page.locator('#uploadBtn').click();
    await expect(page.locator('.error-message')).toHaveText('No file selected');
});
test('TC-UPLOAD-030: test to verify success message after valid Excel upload', async ({ page }) => {
    await page.getByLabel('Upload Excel File').setInputFiles(
        'D:/ILP2025_01_SDET_WS_16082025/JSUsecase/sample.xlsx'
    );
    await page.locator('#uploadBtn').click();
    await expect(page.locator('.success-message')).toHaveText('Upload successful');
});
test('TC-UPLOAD-031:test to verify upload of empty Excel file', async ({ page }) => {
    await page.getByLabel('Upload Excel File').setInputFiles(
        'C:/Users/hrudya.nair/Downloads/Empty.xlsx'
    );
    await page.locator('#uploadBtn').click();
    await expect(page.locator('.error-message')).toHaveText('File contains no data');
});

})