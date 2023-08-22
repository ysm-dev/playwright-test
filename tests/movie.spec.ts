import { test, expect } from '@playwright/test'
import { chromium } from 'playwright-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import 'dotenv/config'

const DO_URL = process.env.DO_URL

chromium.use(stealth())

test('Movie', async ({}) => {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`https://www.crunchbase.com/browser-extension`, {
    waitUntil: 'domcontentloaded',
  })

  const cookie = await getCookie(page)

  await saveCookie(cookie)
  console.log({ cookie })

  await expect(cookie).toBeTruthy()
})

const getCookie = async (page: any) => {
  return await page.evaluate(`(() => {
    return new Promise((resolve) => {
      (window).cookieStore.addEventListener(
        'change',
        async (e) => {
          const cookie = e.changed[0]
          if (cookie?.name === '_px3') {
            resolve({
              token: document.cookie,
              agent: navigator.userAgent,
              expires: new Date(cookie.expires).toISOString(),
            })
          }
        },
      )
    })
  })()`)
}

const saveCookie = async (newData: any) => {
  try {
    const data: object[] = await getData()

    await setData([newData, ...data])
  } catch (e) {
    console.log(e)
  }

  return newData
}

export const setDO = async (key: string, value: any) => {
  const res = await fetch(`${DO_URL}/do/${encodeURIComponent(key)}`, {
    method: 'POST',
    body: JSON.stringify(value),
  })

  if (res.status !== 200) {
    throw new Error(`Failed to set DO: ${res.status}`)
  }

  return res.json()
}

export async function getDO<T = any>(key: string) {
  const res = await fetch(`${DO_URL}/do/${encodeURIComponent(key)}`)

  if (res.status > 399) {
    return null
  }

  return res.json() as Promise<T>
}

const getData = () => getDO('ec321f3e-d0ec-496f-abc9-4a214ce6e5fc')

const setData = (data: any) =>
  setDO('ec321f3e-d0ec-496f-abc9-4a214ce6e5fc', data)
