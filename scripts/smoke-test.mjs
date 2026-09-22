import { spawn } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const URL = 'http://localhost:5199'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function portBusy() {
  try {
    const response = await fetch(URL, { signal: AbortSignal.timeout(1500) })
    return response.ok
  } catch {
    return false
  }
}

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await portBusy()) return
    await sleep(400)
  }
  throw new Error(`dev server did not start at ${URL}`)
}

function killTree(pid) {
  return new Promise((resolve) => {
    const killer = spawn('taskkill', ['/F', '/T', '/PID', String(pid)], {
      windowsHide: true,
      stdio: 'ignore',
    })
    killer.on('exit', () => resolve())
    killer.on('error', () => resolve())
  })
}

let server
try {
  if (await portBusy()) {
    throw new Error(`端口 ${URL} 已被占用，请先清理残留进程`)
  }
  server = spawn(
    'cmd.exe',
    ['/c', 'npm run dev -- --port 5199 --strictPort'],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
  )
  server.stdout.on('data', () => {})
  server.stderr.on('data', (chunk) => process.stderr.write(chunk))

  await waitForServer()
  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  // 1) 三列渲染
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await page.waitForSelector('section[aria-label="待办"]')
  const columnCount = await page.$$eval('section[aria-label]', (els) => els.length)
  if (columnCount < 3) throw new Error(`expected 3 columns, got ${columnCount}`)

  // 2) 弹出表单创建任务（标题必填校验）
  await page.evaluate(() => {
    const section = [...document.querySelectorAll('section[aria-label="待办"]')][0]
    const button = [...section.querySelectorAll('button')].find((b) => b.textContent.includes('添加任务'))
    if (!button) throw new Error('未找到添加任务按钮')
    button.click()
  })
  await page.waitForSelector('#task-title')
  await page.type('#task-title', '浏览器验证任务')
  await page.type('#task-description', '由 Puppeteer 创建')
  const dialogButtons = await page.$$('.fixed button')
  const saveBtn = dialogButtons[dialogButtons.length - 1]
  await saveBtn.click()
  await sleep(300)

  // 3) 通过原生 DragEvent 拖拽卡片到“完成”列
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('article[draggable="true"]')]
    const card = cards.find((c) => c.textContent.includes('浏览器验证任务'))
    if (!card) throw new Error('未找到目标卡片')
    const section = [...document.querySelectorAll('section[aria-label="完成"]')][0]
    if (!section) throw new Error('未找到完成列')
    const dataTransfer = new DataTransfer()
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }))
    section.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }))
    section.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }))
  })
  await sleep(300)
  const doneText = await page.$eval('section[aria-label="完成"]', (el) => el.textContent)
  if (!doneText.includes('浏览器验证任务')) throw new Error('拖拽改状态失败')

  // 4) 深色模式切换并记住（刷新后仍是深色）
  await page.evaluate(() => document.documentElement.classList.remove('dark'))
  await page.click('header button')
  await sleep(200)
  const darkNow = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  if (!darkNow) throw new Error('深色模式未切换')
  await page.reload({ waitUntil: 'networkidle0' })
  const darkPersisted = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  if (!darkPersisted) throw new Error('深色模式选择未持久化')

  // 5) 刷新后数据仍在（持久化）
  const persistedText = await page.$eval('section[aria-label="完成"]', (el) => el.textContent)
  if (!persistedText.includes('浏览器验证任务')) throw new Error('刷新后数据丢失')

  await page.screenshot({ path: 'e2e-screenshot.png' })
  console.log('E2E SMOKE TEST PASSED: 渲染/新增/拖拽/深色模式/持久化 全部通过')
  await browser.close()
} finally {
  if (server) {
    await killTree(server.pid)
    // 等待端口释放
    const start = Date.now()
    while (await portBusy()) {
      if (Date.now() - start > 10000) break
      await sleep(300)
    }
  }
  console.log((await portBusy()) ? '警告: 测试后端口仍被占用' : '端口已释放')
}