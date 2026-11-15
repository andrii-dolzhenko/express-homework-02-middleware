// This static page runs against Express on localhost:3000 and simulates the API
// in browser memory elsewhere (including GitHub Pages). No backend is hosted on Pages.
const LIVE = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port === '3000'
const API_ORIGIN = window.location.origin
const byId = (id) => document.getElementById(id)
const OPTIONS = {
  list: { method: 'GET', needsId: false, needsValue: false },
  read: { method: 'GET', needsId: true, needsValue: false },
  create: { method: 'POST', needsId: false, needsValue: true },
  strict: { method: 'POST', needsId: false, needsValue: true, strict: true },
  update: { method: 'PUT', needsId: true, needsValue: true },
  delete: { method: 'DELETE', needsId: true, needsValue: false },
}
const SEED = {
  users: [{ id: 'test-user-1', name: 'Тестовий користувач 1' }, { id: 'test-user-2', name: 'Тестовий користувач 2' }],
  articles: [{ id: 'test-article-1', title: 'Тестова стаття 1' }, { id: 'test-article-2', title: 'Тестова стаття 2' }],
}
const state = { resource: 'users', operation: 'list', lastResponse: '', pending: false }
let records
let nextId = 1
function resetSimulation() {
  records = Object.fromEntries(Object.entries(SEED).map(([kind, values]) => [kind, new Map(values.map((value) => [value.id, { ...value }]))]))
  nextId = 1
}
resetSimulation()

function fieldName() { return state.resource === 'users' ? 'name' : 'title' }
function fieldLimit() { return state.resource === 'users' ? 100 : 200 }
function currentOperation() { return OPTIONS[state.operation] }
function authorization() {
  return { none: null, basic: 'Basic dGVzdDp0ZXN0', admin: 'Basic admin', bearer: 'Bearer token123' }[byId('authMode').value]
}
function buildRequest() {
  const operation = currentOperation()
  const id = byId('recordId').value.trim()
  const path = `/${state.resource}${operation.strict ? '/strict' : operation.needsId ? `/${encodeURIComponent(id)}` : ''}`
  const payload = operation.needsValue ? { [fieldName()]: byId('recordValue').value } : undefined
  const headers = {}
  if (operation.needsValue) headers['Content-Type'] = 'application/json'
  if (authorization()) headers.Authorization = authorization()
  if (byId('requireAuth').checked) headers['x-require-auth'] = 'true'
  if (state.resource === 'articles' && byId('strictAccess').checked) headers['x-require-strict-access'] = 'true'
  const malformed = operation.needsValue && byId('invalidJson').checked
  return { ...operation, operation: state.operation, resource: state.resource, id, path, payload, headers, malformed }
}
function pipelineLabels(request) {
  if (request.path === '/') return ['Logging', 'Root controller']
  const flow = ['Logging', 'Demo auth', 'Strict auth']
  if (request.resource === 'articles') flow.push('Article access')
  if (request.needsId) flow.push('Resource exists')
  if (request.needsValue) flow.push('Validation')
  flow.push('Controller')
  return flow
}
function updateBuilder() {
  const request = buildRequest()
  byId('idField').classList.toggle('hidden', !request.needsId)
  byId('valueField').classList.toggle('hidden', !request.needsValue)
  byId('invalidJsonRow').classList.toggle('hidden', !request.needsValue)
  byId('accessControlRow').classList.toggle('hidden', state.resource !== 'articles')
  byId('valueLabel').textContent = fieldName().toUpperCase()
  byId('recordId').placeholder = state.resource === 'users' ? 'e.g. test-user-1' : 'e.g. test-article-1'
  byId('recordValue').placeholder = state.resource === 'users' ? 'e.g. Ada Lovelace' : 'e.g. Understanding Middleware'
  byId('validationHint').textContent = `Required · max ${fieldLimit()} characters · whitespace is trimmed.`
  byId('endpointMethod').textContent = request.method
  byId('endpointMethod').className = `method ${request.method.toLowerCase()}`
  byId('endpointPath').textContent = request.needsId && !request.id ? `/${state.resource}/:id` : request.path
  byId('collectionName').textContent = `/${state.resource}`
  for (const el of document.querySelectorAll('[data-resource]')) {
    const selected = el.dataset.resource === state.resource
    el.classList.toggle('active', selected)
    el.setAttribute('aria-pressed', String(selected))
  }
  for (const el of document.querySelectorAll('[data-operation]')) {
    const selected = el.dataset.operation === state.operation
    el.classList.toggle('active', selected)
    el.setAttribute('aria-pressed', String(selected))
  }
  const pipeline = byId('pipelineSteps')
  pipeline.replaceChildren(...pipelineLabels(request).map((name) => {
    const chip = document.createElement('span')
    chip.className = 'pipeline-chip'
    chip.textContent = name
    return chip
  }))
}
function setResource(resource) {
  state.resource = resource
  byId('recordId').value = ''
  byId('recordValue').value = ''
  updateBuilder()
  refreshCollection()
}
function setOperation(operation) { state.operation = operation; updateBuilder() }

function simulatedResponse(status, body) {
  const statusText = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found' }[status] || 'Error'
  return { status, statusText, body: body === undefined ? (status === 204 ? null : statusText) : body }
}
function isDemoAdmin(header) {
  const token = /^Basic\s+(\S+)$/i.exec(header || '')?.[1] || ''
  if (token === 'admin') return true // Matches the instructor's explicitly fake test fixture.
  try { return atob(token).startsWith('admin:') } catch { return false }
}
function simulate(request) {
  // express.json() executes before all route middleware.
  if (request.malformed) return simulatedResponse(400)
  if (request.path === '/' && request.method === 'GET') return simulatedResponse(200, 'Get root route')
  const collection = records[request.resource]
  if (!collection) return simulatedResponse(404)
  const id = request.id
  // The original routes remain usable without auth; /strict and x-require-auth opt in.
  const strictAuth = request.strict || request.headers['x-require-auth'] === 'true'
  if (strictAuth && !/^Basic\s+\S+$/i.test(request.headers.Authorization || '')) return simulatedResponse(401)
  if (request.resource === 'articles' && request.method === 'DELETE' && request.headers['x-require-strict-access'] === 'true' && !isDemoAdmin(request.headers.Authorization)) return simulatedResponse(403)
  if (request.needsId && !collection.has(id)) return simulatedResponse(404)
  const field = request.resource === 'users' ? 'name' : 'title'
  if (request.needsValue) {
    const value = request.payload?.[field]
    if (typeof value !== 'string' || !value.trim() || value.trim().length > (field === 'name' ? 100 : 200)) return simulatedResponse(400)
  }
  if (request.operation === 'list') return simulatedResponse(200, [...collection.values()].map((value) => ({ ...value })))
  if (request.operation === 'read') return simulatedResponse(200, { ...collection.get(id) })
  if (request.operation === 'create' || request.operation === 'strict') {
    const newId = `${request.resource === 'users' ? 'user' : 'article'}-demo-${nextId++}`
    const item = { id: newId, [field]: request.payload[field].trim() }
    collection.set(newId, item)
    return simulatedResponse(201, { ...item })
  }
  if (request.operation === 'update') {
    const item = { id, [field]: request.payload[field].trim() }
    collection.set(id, item)
    return simulatedResponse(200, { ...item })
  }
  if (request.operation === 'delete') {
    collection.delete(id)
    return simulatedResponse(204, null)
  }
  return simulatedResponse(404)
}
async function sendHttp(request) {
  const start = performance.now()
  if (!LIVE) return { ...simulate(request), duration: Math.round(performance.now() - start) }
  const res = await fetch(`${API_ORIGIN}${request.path}`, {
    method: request.method,
    headers: request.headers,
    ...(request.needsValue ? { body: request.malformed ? `{"${request.resource === 'users' ? 'name' : 'title'}":` : JSON.stringify(request.payload) } : {}),
  })
  const rawBody = await res.text()
  let body = rawBody || null
  if (rawBody && res.headers.get('content-type')?.includes('application/json')) {
    try { body = JSON.parse(rawBody) } catch { /* Show unparseable data as plain text. */ }
  }
  return { status: res.status, statusText: res.statusText, body, duration: Math.round(performance.now() - start) }
}
function showResponse(request, result) {
  byId('statusBadge').textContent = `${result.status} ${result.statusText}`
  byId('statusBadge').className = `response-status ${result.status < 400 ? 'ok' : 'bad'}`
  byId('responseMethod').textContent = request.method
  byId('responsePath').textContent = request.path
  byId('responseTime').textContent = `${result.duration} ms`
  state.lastResponse = result.body === null ? '' : typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)
  byId('responseBody').textContent = result.body === null ? '(empty response body)' : state.lastResponse
  byId('responseNote').textContent = result.status === 204 ? '204 No Content: the API intentionally returns an empty response body.' : result.status === 401 ? 'Strict authentication rejected the request. Select Basic authorization and try again.' : result.status === 403 ? 'Strict article access rejected DELETE. Select the demonstration admin credential.' : result.status === 400 ? 'Validation or JSON parsing rejected this request. Check the body and field limit.' : result.status === 404 ? 'The requested record or route was not found.' : 'Request completed. The collection below shows the latest records.'
}
function showNetworkError(message) {
  byId('statusBadge').textContent = 'NETWORK ERROR'
  byId('statusBadge').className = 'response-status bad'
  byId('responseBody').textContent = message
  byId('responseNote').textContent = 'Start the Express server using npm start, then reload http://localhost:3000/demo/.'
}
async function refreshCollection() {
  const kind = state.resource
  const grid = byId('recordsGrid')
  try {
    const requestFor = (resource) => ({ method: 'GET', path: `/${resource}`, resource, operation: 'list', headers: {} })
    const [usersResult, articlesResult] = await Promise.all([sendHttp(requestFor('users')), sendHttp(requestFor('articles'))])
    if (!Array.isArray(usersResult.body) || !Array.isArray(articlesResult.body)) throw new Error('Collection request did not return JSON records')
    byId('usersCount').textContent = String(usersResult.body.length)
    byId('articlesCount').textContent = String(articlesResult.body.length)
    if (kind !== state.resource) return
    const items = kind === 'users' ? usersResult.body : articlesResult.body
    grid.replaceChildren()
    if (!items.length) {
      const empty = document.createElement('div')
      empty.className = 'records-empty'
      empty.textContent = 'No records in this collection. Try POST Create to add one.'
      grid.append(empty)
    }
    for (const [index, item] of items.entries()) {
      const card = document.createElement('article')
      card.className = 'record-card'
      const number = document.createElement('div'); number.className = 'record-number'; number.textContent = `RECORD ${String(index + 1).padStart(2, '0')}`
      const value = document.createElement('div'); value.className = 'record-value'; value.textContent = item[kind === 'users' ? 'name' : 'title'] ?? '(empty)'
      const id = document.createElement('div'); id.className = 'record-id'; id.textContent = String(item.id)
      const button = document.createElement('button'); button.type = 'button'; button.className = 'record-select'; button.textContent = 'Use this ID ↗'
      button.addEventListener('click', () => {
        byId('recordId').value = String(item.id)
        setOperation('read')
        document.querySelector('.request-panel').scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      card.append(number, value, id, button)
      grid.append(card)
    }
  } catch (error) {
    if (kind !== state.resource) return
    grid.replaceChildren()
    const empty = document.createElement('div'); empty.className = 'records-empty'; empty.textContent = `Could not load the collection: ${error.message}`; grid.append(empty)
  }
}
async function runRequest(request) {
  if (state.pending) return
  state.pending = true
  byId('sendButton').disabled = true
  try {
    const result = await sendHttp(request)
    showResponse(request, result)
    await refreshCollection()
  } catch (error) {
    showNetworkError(error.message)
  } finally {
    state.pending = false
    byId('sendButton').disabled = false
  }
}
function sendCurrent() {
  const request = buildRequest()
  if (request.needsId && !request.id) {
    byId('recordId').setCustomValidity('Enter a resource ID or select a record below.')
    byId('recordId').reportValidity()
    byId('recordId').setCustomValidity('')
    return
  }
  runRequest(request)
}
function chooseScenario(code) {
  byId('recordValue').value = ''
  byId('recordId').value = ''
  byId('requireAuth').checked = false
  byId('strictAccess').checked = false
  byId('invalidJson').checked = false
  byId('authMode').value = 'none'
  if (code === '401') { state.resource = 'users'; state.operation = 'strict'; byId('recordValue').value = 'Demo User' }
  if (code === '403') { state.resource = 'articles'; state.operation = 'delete'; byId('recordId').value = 'test-article-1'; byId('authMode').value = 'basic'; byId('strictAccess').checked = true }
  if (code === '400') { state.resource = 'users'; state.operation = 'create'; byId('recordValue').value = 'A'.repeat(101) }
  if (code === '404') { state.resource = 'users'; state.operation = 'read'; byId('recordId').value = 'missing-user-999' }
  updateBuilder()
  runRequest(buildRequest())
}
function quoteShell(str) { return `'${String(str).replace(/'/g, `'\\''`)}'` }
function curlCommand(request) {
  const base = `curl -i -X ${request.method} ${quoteShell(`http://localhost:3000${request.path}`)}`
  const headerArgs = Object.entries(request.headers).map(([key, value]) => ` -H ${quoteShell(`${key}: ${value}`)}`).join('')
  const bodyArg = request.needsValue ? ` --data-raw ${quoteShell(request.malformed ? `{"${request.resource === 'users' ? 'name' : 'title'}":` : JSON.stringify(request.payload))}` : ''
  return `${base}${headerArgs}${bodyArg}`
}
async function copyText(value, button) {
  const label = button.textContent
  try {
    await navigator.clipboard.writeText(value)
    button.textContent = 'Copied ✓'
  } catch {
    button.textContent = 'Copy unavailable'
  }
  window.setTimeout(() => { button.textContent = label }, 1500)
}
for (const el of document.querySelectorAll('[data-resource]')) el.addEventListener('click', () => setResource(el.dataset.resource))
for (const el of document.querySelectorAll('[data-operation]')) el.addEventListener('click', () => setOperation(el.dataset.operation))
for (const el of document.querySelectorAll('[data-scenario]')) el.addEventListener('click', () => chooseScenario(el.dataset.scenario))
for (const id of ['recordId', 'recordValue', 'authMode', 'requireAuth', 'strictAccess', 'invalidJson']) byId(id).addEventListener('input', updateBuilder)
byId('requestForm').addEventListener('submit', (event) => { event.preventDefault(); sendCurrent() })
byId('refreshCollection').addEventListener('click', refreshCollection)
byId('resetDemo').addEventListener('click', () => {
  resetSimulation()
  state.lastResponse = ''
  byId('responseBody').textContent = '// Simulation reset. Send a request to begin.'
  byId('statusBadge').textContent = 'READY'
  byId('statusBadge').className = 'response-status'
  byId('responseNote').textContent = 'Browser memory restored to the initial users and articles.'
  refreshCollection()
})
byId('pingRoot').addEventListener('click', () => runRequest({ method: 'GET', path: '/', resource: '', headers: {} }))
byId('copyResponse').addEventListener('click', (event) => copyText(state.lastResponse, event.currentTarget))
byId('copyCurl').addEventListener('click', (event) => copyText(curlCommand(buildRequest()), event.currentTarget))
if (LIVE) {
  byId('environmentLabel').textContent = 'LIVE EXPRESS API'
  byId('modeTitle').textContent = 'Connected to local Express · real HTTP requests'
  byId('modeDescription').textContent = 'Requests are sent to localhost:3000. Records change on the running Node.js server and reset when it restarts. The middleware flow below describes configuration, not collected server logs.'
} else {
  byId('environmentLabel').textContent = 'INTERACTIVE PREVIEW'
  byId('modeTitle').textContent = 'Browser simulation · no hosted backend'
  byId('modeDescription').textContent = 'Static hosting cannot run Express. This educational preview simulates the tested middleware rules and CRUD responses in browser memory; it resets when reloaded. To use the real API, run npm start and open localhost:3000/demo/.'
  byId('resetDemo').classList.remove('hidden')
}
updateBuilder()
refreshCollection()
