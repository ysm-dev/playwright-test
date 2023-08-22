import { test, expect } from "@playwright/test";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import { concurrent, toArray, slice, pipe, map, toAsync } from "@fxts/core";
import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { getIpfsURL, uploadIPFS } from "../utils/uploadIPFS";
import { $ } from "zx";
import { Feed } from "../utils/feed/feed";

chromium.use(stealth());

test("FB", async ({}) => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const xs = process.env.xs;

  if (!xs) throw new Error("env not found");

  await context.addCookies([
    {
      name: "c_user",
      value: "100003670407958",
      domain: ".facebook.com",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: true,
      sameSite: "None",
    },
    {
      name: "xs",
      value: xs,
      domain: ".facebook.com",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: true,
      sameSite: "None",
    },
    {
      name: "wd",
      value: "1920x1080",
      domain: ".facebook.com",
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: true,
      sameSite: "None",
    },
  ]);

  const SUBS = [`realryunsu`, `cjunekim`];

  await pipe(
    SUBS,
    toAsync,
    map(async (ID) => {
      const page = await context.newPage();

      await page.goto(`https://www.facebook.com/${ID}`, { waitUntil: "load" });

      await page.waitForTimeout(1000);

      const postLocator =
        "body div[role=main] > div:nth-child(4) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div";

      const timeLocator = "span[id] a";

      await page.evaluate(() => {
        const d = document.querySelector(
          "body div[role=main] > div:nth-child(4) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1)"
        );

        if (d?.textContent?.includes("something")) d.remove();
      });

      await page.evaluate(() => {
        window.scrollTo(0, 9999);
      });

      await page.waitForSelector(`${postLocator}:nth-child(4) ${timeLocator}`);

      const hrefs = await page.evaluate(
        ({ postLocator, timeLocator }) => {
          const posts = [...document.querySelectorAll(postLocator)]
            .map((q) => q.querySelector(timeLocator)?.parentNode)
            .filter(Boolean);

          if (posts.length === 0) throw new Error("DOM not found");

          const getURL = (dom: HTMLElement | ParentNode): string =>
            // @ts-ignore
            dom[Object.keys(dom).filter((n) => n.startsWith("__reactProps"))[0]]
              .children.props.children.props.href;

          document.querySelector("div[role=banner]")?.remove();

          return posts.map((dom) => getURL(dom as ParentNode));
        },
        { postLocator, timeLocator }
      );

      console.log(hrefs);

      await page.close();

      const data = await pipe(
        hrefs,
        slice(0, 5),
        toAsync,
        map(async (href) => {
          const page = await context.newPage();

          await page.goto(href, { waitUntil: "load" });

          await page.evaluate(() => {
            document.querySelector("div[role=banner]")?.remove();
          });

          const i = hrefs.indexOf(href);

          await page
            .locator("div[role=main] > div > div")
            .screenshot({ path: `${ID}_${i}.png` });

          await page.close();

          return href;
        }),
        concurrent(hrefs.length),
        toArray,
        toAsync,
        map(async (href) => {
          const i = hrefs.indexOf(href);
          const path = `${ID}_${i}.png`;

          const data = await uploadIPFS(path);

          console.log({
            link: href,
            title: getIpfsURL(data.value.cid),
          });

          await $`rm ${path}`;

          return {
            link: href,
            title: getIpfsURL(data.value.cid),
          };
        }),
        concurrent(hrefs.length),
        toArray
      );

      const feed = new Feed({
        title: `Facebook: ${ID}`,
        id: `https://facebook.com/${ID}`,
        link: `https://facebook.com/${ID}`,
        updated: new Date(),
        copyright: "",
      });

      for (const { title, link } of data) {
        feed.addItem({
          title,
          id: link,
          link,
          // content: itemTitle,
          date: new Date(),
        });
      }

      await writeFile(`./fb/${ID}.xml`, feed.atom(), "utf-8");
    }),
    concurrent(SUBS.length),
    toArray
  );
});
