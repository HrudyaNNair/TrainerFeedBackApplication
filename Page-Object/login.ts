import { Page,Locator } from "@playwright/test";
export class login{
    readonly page: Page;
    readonly email: Locator;
    readonly password: Locator;
    readonly loginBtn: Locator;

    constructor(page:Page){
        this.page = page;
        this.email = page.locator('#loginEmail')
        this.password = page.locator('#loginPassword')
        this.loginBtn = page.getByRole('button', { name: "Login" })
    }

    async loginTo(email:string,password:string){
        await this.email.fill(email);
        await this.password.fill(password);
        await this.loginBtn.click();
    }
}