import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { delay } from "./lib/delay.js";
import { sendEmail } from "./lib/email.js";
import config from "./config.json" assert { type: "json" };

dotenv.config();

config.targetUrl = process.argv[2];
if (!config.targetUrl) {
  console.error("Please provide a target url");
  process.exit(1);
}

const errorReport = [];

do {
  try {
    await runBot({ config });
    process.exit(0);
  } catch (err) {
    await handleError({ err, report: errorReport, config });
  }
} while (config.retry.count >= 0);

if (errorReport.length) {
  await sendEmail({ title: "mail.ru bot error", text: errorReport.join("\n") });
  process.exit(1);
}

async function runBot({ config }) {
  let browser;

  try {
    const delays = config.delays;
    browser = await launchBrowser(config);
    const page = await goToTargetPage({ browser, ...config });

    await logIn({ page, delays });
    await enterMeeting({ page, delays });
    await openChat({ page, delays });
    await writeMessage({ page, message: config.chatMessage });
    await exitMeeting({ browser, delays });
  } finally {
    browser?.close();
  }
}

async function handleError({ err, report, config }) {
  report.push(`[${config.targetUrl}]: ${err}`);
  config.retry.count--;

  if (config.retry.count >= 0) {
    await delay(config.retry.pause);

    for (const delay of Object.keys(config.delays)) {
      config.delays[delay] *= config.retry.delayMultiplier;
    }
  }
}

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
  await page.evaluate(async () => {
    const buttons = [...document.querySelectorAll("button")];
    const openChatButton = buttons.find(
      (b) => b.textContent.toLowerCase() === "чат"
    );
    await openChatButton.click();
  });
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

async function exitMeeting({ browser, delays }) {
  await delay(delays.beforeClose);
  await browser.close();
}
