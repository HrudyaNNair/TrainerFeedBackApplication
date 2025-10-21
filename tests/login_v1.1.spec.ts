import { test,expect } from '@playwright/test';
import { login } from '../Page-Object/login';

test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5503/login.html')
});
test('login with valid credentials',async({page})=>{
    const loginWith = new login(page);
    await loginWith.loginTo("hrudyannair@gmail.com","Hrudya@2001")
})
test('login with invalid credentials',async({page})=>{
    const loginWith = new login(page);
    await loginWith.loginTo("hrudyannairgmail.com","Hrudya2001")
    await expect(page).toHaveURL('http://127.0.0.1:5503/login.html');
})
test('login with no credentials',async({page})=>{
    const loginWith = new login(page);
    await loginWith.loginTo("","")
    await expect(page).toHaveURL('http://127.0.0.1:5503/login.html');
})