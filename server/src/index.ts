import { config } from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') })
import { startResearch, subscribeToRun } from './runner.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

app.get('/healthz', (_req, res) => res.send('ok'))

app.post('/api/research', (req, res) => {
  const query =
    typeof req.body?.query === 'string'
      ? req.body.query.trim()
      : typeof req.body?.ticker === 'string'
        ? req.body.ticker.trim()
        : ''
  if (!query) {
    return res.status(400).json({ error: 'Enter a research query' })
  }
  const runId = startResearch(query)
  res.json({ runId })
})

app.get('/api/research/:runId/events', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  const sub = subscribeToRun(req.params.runId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
    const flush = (res as unknown as { flush?: () => void }).flush
    if (typeof flush === 'function') flush()
  })

  if (!sub) {
    res.write(`data: ${JSON.stringify({ type: 'failed', error: 'Run not found' })}\n\n`)
    res.end()
    return
  }

  await sub.whenDone
  res.end()
})

const uiDist = path.join(__dirname, '../../ui/dist')
app.use(
  express.static(uiDist, {
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      }
    },
  })
)
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.sendFile(path.join(uiDist, 'index.html'))
})

const port = parseInt(process.env.PORT ?? '3000', 10)
app.listen(port, () => console.log(`Server on :${port}`))
