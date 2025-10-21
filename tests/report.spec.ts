import { test, expect } from '@playwright/test';

test.describe('Suite 1', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5503/login.html')
        await page.getByPlaceholder('Email').first().fill("hrudyannair@gmail.com")
        await page.getByPlaceholder('Password').first().fill("Hrudya@2001")
        await page.getByRole('button', { name: "Login" }).click();
        await page.getByLabel('Upload Excel File').setInputFiles(
            'D:/ILP2025_01_SDET_WS_16082025/JSUsecase/ILP - Tech Fundamentals _ Final Feedback _ 2024-25 Batch(1-24) (1) (Use Case).xlsx'
        );
        await page.locator('#uploadBtn').click();
    })
    test('TC-REPORT-032: test by title', async ({ page }) => {
        await page.getByTitle('Feedback System');
    });

    test('TC-REPORT-033: test by text', async ({ page }) => {
        await page.getByText('Feedback Report Generator').click();
    });
    test('TC-REPORT-034: test for label for batch', async ({ page }) => {
        page.getByLabel('Batch:')
    })
    test('TC-REPORT-035: test for label for Report Name:', async ({ page }) => {
        page.getByLabel('Report Name:')
    })
    test('TC-REPORT-036: test for label for Select Trainer:', async ({ page }) => {
        page.getByLabel('Select Trainer:')
    })
    test('TC-REPORT-037: test for placeholder for batch', async ({ page }) => {
        page.getByPlaceholder('Enter ILP batch name')
    })
    test('TC-REPORT-038: test for placeholder for report name', async ({ page }) => {
        page.getByPlaceholder('Enter Report name')
    })
    test('TC-REPORT-039: Select Trainer', async ({ page }) => {
        const options = page.locator('#trainerDropdown option');
        await expect(options).toHaveText([
            "Select Trainer",
            "Suneesh Thampi",
            "Lekshmi Asokan",
            "Hari"
        ]);
    });

})
test.describe('Suite 2', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5503/login.html')
        await page.getByPlaceholder('Email').first().fill("hrudyannair@gmail.com")
        await page.getByPlaceholder('Password').first().fill("Hrudya@2001")
        await page.getByRole('button', { name: "Login" }).click();
        await page.getByLabel('Upload Excel File').setInputFiles(
            "D:/ILP2025_01_SDET_WS_16082025/JSUsecase/ILP _ Angular _ Final Feedback _ Batch 5 _2023-24(1-20) (Use Case).xlsx"
        );
        await page.locator('#uploadBtn').click();
    })
    test('TC-REPORT-040: test for label Trainer Name:', async ({ page }) => {
        page.getByLabel('Trainer Name:')
    })
    test('TC-REPORT-041: test for single trainer', async ({ page }) => {
        const trainer = page.locator('#trainerName');
        await expect(trainer).toHaveAttribute('placeholder', 'Enter Trainer Name');
    })
    test('TC-REPORT-042: test for back button', async ({ page }) => {
        await page.locator('#backBtn');
        const btn = page.locator('#uploadBtn')
        await expect(btn).toHaveText('Upload')
    })
    test('TC-REPORT-043: test for generate button', async ({ page }) => {
        await page.getByRole('button', { name: "Generate Report" }).click();
    });
    test.describe('Suite 3', () => {
        test.beforeEach(async ({ page }) => {
            await page.locator('#batch').fill('2025');
            await page.locator('#reportName').fill('FeedBack For Suneesh Thampi');
            await page.locator('#trainerName').fill('Suneesh Thampi');
            await page.locator('#generateBtn').click();
        })
        test('TC-REPORT-044: test for report generation', async ({ page }) => {
            await page.locator('#plugin')
        })
        test('TC-REPORT-045: test for Download PDF', async ({ page }) => {
            await page.getByRole('button', { name: "Download PDF" });
        })
        test('TC-REPORT-046: test for Cancel Preview', async ({ page }) => {
            await page.getByRole('button', { name: "Cancel Preview" }).click();
        })
    })
 })