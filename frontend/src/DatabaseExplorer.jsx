/* eslint-disable react-hooks/set-state-in-effect -- Effects load table data asynchronously. */
import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from './api'
import './database.css'

function DatabaseLogin({ onAuth }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const { data } = await api.post('/auth/login', Object.fromEntries(new FormData(event.currentTarget)))
      if (data.user.role !== 'ADMIN') { setError('An administrator account is required to view database tables.'); return }
      sessionStorage.setItem('ransomguard-token', data.token); onAuth(data.user)
    } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  return <div className="db-login"><section><a className="db-wordmark" href="https://cybershield-workspace.vercel.app">Ransom<span>Guard.</span></a><span className="eyebrow">BACKEND / ADMINISTRATION</span><h1>Your data,<br/>in plain <em>view.</em></h1><p>Explore the application's database tables, columns, and live records from one secure console.</p><div className="db-login-note"><b>Spring Boot · MySQL · JWT</b><span>Administrator sign-in required</span></div></section><main><span className="eyebrow">DATABASE CONSOLE</span><h2>Sign in to inspect your data.</h2><p>Use your administrator account to open the database dashboard.</p>{error && <div className="error" role="alert">{error}</div>}<form onSubmit={submit}><label className="field"><span>Admin email</span><input name="email" type="email" autoComplete="username" required maxLength={180} placeholder="admin@company.com"/></label><label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required maxLength={72} placeholder="Enter your admin password"/></label><button className="btn primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Open database console'} <span>→</span></button></form><small>Read-only access · BCrypt password hashes are visible to administrators</small><a href="https://cybershield-workspace.vercel.app/login">Go to the user website ↗</a></main></div>
}

const isPasswordHash = (table, column) => table === 'cs_users' && column.name === 'password_hash'
const valueText = value => value === null ? 'NULL' : typeof value === 'object' ? JSON.stringify(value) : String(value)

export default function DatabaseExplorer({ user, onAuth, logout }) {
  const [catalog, setCatalog] = useState(null), [selected, setSelected] = useState(''), [page, setPage] = useState(0)
  const [table, setTable] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [search, setSearch] = useState(''), [view, setView] = useState('records'), [refresh, setRefresh] = useState(0)
  const admin = user?.role === 'ADMIN'
  const loadCatalog = useCallback(async () => {
    if (!admin) return
    setError('')
    try {
      const { data } = await api.get('/admin/database'); setCatalog(data)
      setSelected(current => data.tables.some(item => item.name === current) ? current : data.tables[0]?.name || '')
    } catch (e) { setError(errorMessage(e)) }
  }, [admin])
  useEffect(() => { loadCatalog() }, [loadCatalog, refresh])
  useEffect(() => {
    if (!admin || !selected) return
    let cancelled = false
    setBusy(true); setError(''); setTable(null)
    api.get('/admin/database/table', { params: { name: selected, page } }).then(({ data }) => {
      if (!cancelled) setTable(data)
    }).catch(e => { if (!cancelled) setError(errorMessage(e)) }).finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [admin, selected, page, refresh])

  if (!user) return <DatabaseLogin onAuth={onAuth}/>
  if (!admin) return <div className="db-denied"><span className="eyebrow">ADMINISTRATOR ACCESS</span><h1>This console is for administrators.</h1><p>Sign in with an admin account to view database tables.</p><button className="btn primary" onClick={logout}>Sign in with another account</button><a href="/app/overview">Return to your workspace</a></div>
  const tables = catalog?.tables.filter(item => item.name.toLowerCase().includes(search.toLowerCase())) || []
  const totalRows = catalog?.tables.reduce((sum, item) => sum + item.rows, 0) || 0
  const pageCount = table ? Math.max(1, Math.ceil(table.total / table.pageSize)) : 1
  return <div className="database"><header className="db-top"><a className="db-wordmark" href="https://cybershield-workspace.vercel.app">Ransom<span>Guard.</span></a><div><span className="db-live"><i/>{error ? 'Connection needs attention' : catalog ? 'Database connected' : 'Connecting…'}</span><span className="db-admin">{user.name} · Admin</span><button className="btn small" onClick={logout}>Sign out</button></div></header><div className="db-layout"><aside className="db-sidebar"><span className="eyebrow">MYSQL DATABASE</span><h2>{catalog?.name || 'Application database'}</h2><div className="db-search"><input aria-label="Search database tables" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tables…"/></div><div className="db-table-heading">TABLES <span>{catalog?.tables.length || 0}</span></div><nav>{tables.map(item => <button key={item.name} className={selected === item.name ? 'active' : ''} onClick={() => { setSelected(item.name); setPage(0); setView('records') }}><span className="db-table-icon">▦</span><span>{item.name}</span><b>{item.rows}</b></button>)}</nav>{catalog && !tables.length && <p className="muted">No matching tables.</p>}<div className="db-sidebar-foot"><b>Read-only console</b><p>Stored BCrypt password hashes are visible to administrators. Other passwords, tokens, and secret values stay protected.</p><a href="https://cybershield-workspace.vercel.app/app/overview">Open user website ↗</a></div></aside><main className="db-main"><div className="heading"><div><span className="eyebrow">BACKEND DATA EXPLORER</span><h1>Database tables<span>.</span></h1><p>Inspect the live records behind your file protection workspace.</p></div><button className="btn" onClick={() => setRefresh(current => current + 1)} disabled={busy}>↻ Refresh</button></div><div className="db-stats"><article><small>DATABASE TABLES</small><strong>{catalog?.tables.length ?? '—'}</strong><span>All tables in this application's database</span></article><article><small>TOTAL RECORDS</small><strong>{catalog ? totalRows.toLocaleString() : '—'}</strong><span>Across users, scans, tasks, and activity</span></article><article><small>AUTHENTICATION</small><strong>JWT</strong><span>Administrator access · BCrypt password hashes</span></article></div>{error && <div className="error" role="alert">{error}<button className="btn small" onClick={() => setRefresh(current => current + 1)}>Retry</button></div>}<section className="panel db-data"><header><div><span className="eyebrow">SELECTED TABLE</span><h2>{selected || 'Select a table'} <span>{table?.total ?? '—'} records</span></h2></div><div className="db-tabs"><button className={view === 'records' ? 'active' : ''} onClick={() => setView('records')}>Records</button><button className={view === 'columns' ? 'active' : ''} onClick={() => setView('columns')}>Columns {table && <span>{table.columns.length}</span>}</button></div></header>{busy || !catalog && !error ? <div className="loading"><i/>Loading database records…</div> : table && view === 'columns' ? <div className="table-wrap"><table><thead><tr><th>Column name</th><th>Type</th><th>Nullable</th><th>Key / protection</th></tr></thead><tbody>{table.columns.map(column => <tr key={column.name}><td><code>{column.name}</code></td><td>{column.type}</td><td>{column.nullable ? 'Yes' : 'No'}</td><td>{isPasswordHash(selected, column) && <span className="db-tag">BCrypt password hash</span>}{column.primaryKey && <span className="db-tag">Primary key</span>}{column.protectedValue && <span className="db-tag protected">Protected value</span>}{!column.primaryKey && !column.protectedValue && !isPasswordHash(selected, column) && '—'}</td></tr>)}</tbody></table></div> : table ? <><div className="table-wrap db-records"><table><thead><tr>{table.columns.map(column => <th key={column.name}><code>{column.name}</code><small>{column.type}{column.primaryKey ? ' · PK' : ''}{isPasswordHash(selected, column) ? ' · BCrypt password hash' : column.protectedValue ? ' · protected' : ''}</small></th>)}</tr></thead><tbody>{table.rows.map((row, index) => <tr key={row.id ?? index}>{table.columns.map(column => <td key={column.name} title={column.protectedValue ? 'Sensitive values are protected' : valueText(row[column.name])}><span className={isPasswordHash(selected, column) ? 'db-password-hash' : column.protectedValue ? 'db-protected' : row[column.name] === null ? 'db-null' : ''}>{valueText(row[column.name])}</span></td>)}</tr>)}</tbody></table></div>{!table.rows.length && <div className="db-empty"><b>No records in this table yet.</b><p>New records appear here when users sign up, check files, and complete tasks.</p></div>}<footer className="db-pagination"><span>{table.total ? `${page * table.pageSize + 1}–${Math.min((page + 1) * table.pageSize, table.total)}` : '0'} of {table.total} records</span><div><button className="btn small" disabled={page === 0 || busy} onClick={() => setPage(current => current - 1)}>← Previous</button><span>Page {page + 1} of {pageCount}</span><button className="btn small" disabled={page + 1 >= pageCount || busy} onClick={() => setPage(current => current + 1)}>Next →</button></div></footer></> : !error && <div className="db-empty">Choose a table from the sidebar.</div>}</section><p className="db-bottom">RansomGuard backend · Spring Boot API · MySQL data · Read-only administrator view</p></main></div></div>
}
