import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { delay } from "./lib/delay.js";
import { waitForAnySelector } from "./lib/waitForAnySelector.js";

dotenv.config();
const targetUrl =
  // "https://calls.mail.ru/room/0d9a6beb-2627-4a3f-a80b-432b1688d845";
  "https://calls.mail.ru/room/2cd1ffff-a5a9-410c-a9cd-8851edf121ea";
// "https://calls.mail.ru/room/0d9a6beb-2627-4a3f-a80b-432b1688d845";

const browser = await puppeteer.launch({
  headless: true,
  timeout: 200000,
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
  ],
  ignoreDefaultArgs: ["--mute-audio"],
});
const context = browser.defaultBrowserContext();
await context.overridePermissions(targetUrl, ["microphone"]);

const page = await browser.newPage();
await page.goto(targetUrl);
await page.setViewport({ height: 700, width: 1200, deviceScaleFactor: 0.1 });
await delay(10000);

const loginButton = await page.waitForSelector("#PH_authLink");
await loginButton.click();
await delay(10000);
const authFrame = page
  .frames()
  .find((f) => f.url().includes("account.mail.ru/login"));
const emailInput = await authFrame.waitForSelector(".input-0-2-71");
await emailInput.type(process.env.EMAIL);
const enterPasswordButton = await authFrame.waitForSelector(
  ".base-0-2-79.primary-0-2-93"
);
await enterPasswordButton.click();
const passwordInput = await authFrame.waitForSelector(
  ".input-0-2-71.withIcon-0-2-72"
);
await passwordInput.type(process.env.PASSWORD);
const submitButton = await authFrame.waitForSelector(
  ".base-0-2-79.primary-0-2-93"
);
await submitButton.click();
page.once("dialog", (reloadConfirmation) => {
  reloadConfirmation.accept();
});
await delay(60000);

const microphoneCheckbox = await page.waitForSelector(".box-0-2-93");
await microphoneCheckbox.click();
const startWithoutCamButton = await page.waitForSelector(
  ".base-0-2-100.base-d7-0-2-142"
);
await startWithoutCamButton.click();
await delay(10000);

const openChatButton = await waitForAnySelector(
  page,
  ".base-0-2-144.base-d5-0-2-175",
  ".base-0-2-563.base-d5-0-2-594"
);
await openChatButton.click();
await delay(25000);
const chatFrame = page
  .frames()
  .find((f) => f.url().includes("webagent.mail.ru"));
const chatInput = await chatFrame.waitForSelector(
  ".im-textfield_rich.im-chat__input-field"
);
await chatInput.type("Бракало ПИ-20в");
await page.keyboard.press("Enter");

await delay(30000);
await browser.close();
