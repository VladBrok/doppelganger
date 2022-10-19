import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { delay } from "./lib/delay.js";
import { waitForAnySelector } from "./lib/waitForAnySelector.js";
import config from "./config.json" assert { type: "json" };

dotenv.config();

const delays = config.delays;
const browser = await launchBrowser(config);
const page = await goToTargetPage({ browser, ...config });

await logIn({ page, delays });
await enterMeeting({ page, delays });
await openChat({ page, delays });
await writeMessage({ page, message: config.chatMessage });

await closeBrowser({ browser, delays });

async function launchBrowser({ targetUrl, headless, launchTimeout }) {
  const browser = await puppeteer.launch({
    headless,
    timeout: launchTimeout,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    ignoreDefaultArgs: ["--mute-audio"],
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(targetUrl, ["microphone"]);

  return browser;
}

async function goToTargetPage({ browser, targetUrl, pageViewport, delays }) {
  const page = await browser.newPage();
  await page.goto(targetUrl);
  await page.setViewport(pageViewport);
  await delay(delays.pageLoad);

  return page;
}

async function logIn({ page, delays }) {
  const loginButton = await page.waitForSelector("#PH_authLink");
  await loginButton.click();
  await delay(delays.authFrameLoad);
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
  await delay(delays.afterLogIn);
}

async function enterMeeting({ page, delays }) {
  const microphoneCheckbox = await page.waitForSelector(".box-0-2-93");
  await microphoneCheckbox.click();

  const startWithoutCamButton = await page.waitForSelector(
    ".base-0-2-100.base-d7-0-2-142"
  );
  await startWithoutCamButton.click();
  await delay(delays.afterStart);
}

async function openChat({ page, delays }) {
  const openChatButton = await waitForAnySelector(
    page,
    ".base-0-2-144.base-d5-0-2-175",
    ".base-0-2-563.base-d5-0-2-594"
  );
  await openChatButton.click();
  await delay(delays.chatLoad);
}

async function writeMessage({ page, message }) {
  const chatFrame = page
    .frames()
    .find((f) => f.url().includes("webagent.mail.ru"));
  const chatInput = await chatFrame.waitForSelector(
    ".im-textfield_rich.im-chat__input-field"
  );
  await chatInput.type(message);
  await page.keyboard.press("Enter");
}

async function closeBrowser({ browser, delays }) {
  await delay(delays.beforeClose);
  await browser.close();
}

// "https://calls.mail.ru/room/0d9a6beb-2627-4a3f-a80b-432b1688d845"; // ?
// "https://calls.mail.ru/room/2cd1ffff-a5a9-410c-a9cd-8851edf121ea"; // test
// "https://calls.mail.ru/room/0d9a6beb-2627-4a3f-a80b-432b1688d845"; // oks
