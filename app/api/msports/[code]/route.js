import { chromium } from "playwright";

export async function GET(req, context) {
  const { code } = await context.params;

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 900 },
    });

    // 1️⃣ Open MSport WEB
    await page.goto("https://msport.com/gh/web", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // ⏳ let React hydrate
    await page.waitForTimeout(4000);

    // 2️⃣ Open betslip panel (RIGHT SIDE)
    await page.evaluate(() => {
      const betslipBtn = Array.from(
        document.querySelectorAll("button, div"),
      ).find((el) => el.innerText?.toLowerCase().includes("betslip"));
      betslipBtn?.click();
    });

    // ⏳ wait for panel animation
    await page.waitForTimeout(3000);

    // 3️⃣ Find booking input INSIDE betslip
    const bookingInputSelector =
      "input[type='text'], input[placeholder], input";

    await page.waitForSelector(bookingInputSelector, { timeout: 10000 });

    // 4️⃣ Fill booking code
    await page.fill(bookingInputSelector, code);

    // 5️⃣ Click Load button
    await page.evaluate(() => {
      const loadBtn = Array.from(document.querySelectorAll("button")).find(
        (el) => el.innerText?.toLowerCase().includes("load"),
      );
      loadBtn?.click();
    });

    // ⏳ wait for betslip to populate
    await page.waitForTimeout(4000);

    // 6️⃣ Extract matches from betslip
    const matches = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("li, div"))
        .map((el) => {
          const text = el.innerText || "";

          const teams = text.match(/(.+?)\s+vs\s+(.+?)(\n|$)/i);
          const odds = text.match(/\b(\d+\.\d+)\b/);

          if (!teams) return null;

          return {
            homeTeam: teams[1].trim(),
            awayTeam: teams[2].trim(),
            odds: odds?.[1] ?? "N/A",
            league: "",
            status: "Pending",
          };
        })
        .filter(Boolean);
    });

    return Response.json({
      provider: "msports",
      bookingCode: code,
      matches,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  } finally {
    await browser.close();
  }
}
