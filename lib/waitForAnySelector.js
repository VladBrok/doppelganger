export async function waitForAnySelector(page, ...selectors) {
  for (const s of selectors) {
    try {
      return await page.waitForSelector(s);
    } catch {}
  }

  return null;
}
