import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { randomUUID } from 'crypto'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'planwell.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    migrate(db)
  }
  return db
}

function migrate(db: Database.Database): void {
  const version = db.pragma('user_version', { simple: true }) as number

  if (version < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id          TEXT    PRIMARY KEY,
        name        TEXT    NOT NULL,
        description TEXT    DEFAULT '',
        status      TEXT    DEFAULT 'active',
        color       TEXT    DEFAULT '#f0a500',
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id            TEXT    PRIMARY KEY,
        project_id    TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title         TEXT    NOT NULL,
        description   TEXT    DEFAULT '',
        status        TEXT    DEFAULT 'todo',
        estimate_days REAL,
        start_date    INTEGER,
        end_date      INTEGER,
        position      INTEGER DEFAULT 0,
        created_at    INTEGER NOT NULL,
        updated_at    INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS dependencies (
        id           TEXT    PRIMARY KEY,
        task_id      TEXT    NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        depends_on_id TEXT   NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        created_at   INTEGER NOT NULL,
        UNIQUE(task_id, depends_on_id)
      );
    `)
    db.pragma('user_version = 1')
  }

  if (version < 2) {
    try { db.exec(`ALTER TABLE projects ADD COLUMN target_date INTEGER`) } catch {}
    db.pragma('user_version = 2')
  }
}

// ── Projects ─────────────────────────────────────────────

export function listProjects() {
  return getDb()
    .prepare(`
      SELECT p.*, COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)
    .all()
}

export function createProject(name: string, description = '', color = '#f0a500') {
  const now = Date.now()
  const id = randomUUID()
  getDb()
    .prepare(
      `INSERT INTO projects (id, name, description, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, name.trim(), description.trim(), color, now, now)
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id)
}

export function updateProject(
  id: string,
  fields: Partial<{ name: string; description: string; status: string; color: string; target_date: number | null }>
) {
  const now = Date.now()
  const sets = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ')
  getDb()
    .prepare(`UPDATE projects SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...Object.values(fields), now, id)
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id)
}

export function deleteProject(id: string) {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
}

export function listAllTasks() {
  return getDb()
    .prepare('SELECT * FROM tasks ORDER BY project_id, position ASC, created_at ASC')
    .all()
}

// ── Tasks ─────────────────────────────────────────────────

export function listTasks(projectId: string) {
  return getDb()
    .prepare(
      'SELECT * FROM tasks WHERE project_id = ? ORDER BY position ASC, created_at ASC'
    )
    .all(projectId)
}

export function createTask(
  projectId: string,
  title: string,
  description = '',
  estimateDays?: number
) {
  const now = Date.now()
  const id = randomUUID()
  const row = getDb()
    .prepare('SELECT MAX(position) as m FROM tasks WHERE project_id = ?')
    .get(projectId) as { m: number | null }
  const position = (row?.m ?? 0) + 1
  getDb()
    .prepare(
      `INSERT INTO tasks (id, project_id, title, description, estimate_days, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, projectId, title.trim(), description.trim(), estimateDays ?? null, position, now, now)
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id)
}

export function updateTask(
  id: string,
  fields: Partial<{
    title: string
    description: string
    status: string
    estimate_days: number
    start_date: number
    end_date: number
    position: number
  }>
) {
  const now = Date.now()
  const sets = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ')
  getDb()
    .prepare(`UPDATE tasks SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...Object.values(fields), now, id)
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id)
}

export function deleteTask(id: string) {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id)
}

export function reorderTasks(projectId: string, orderedIds: string[]) {
  const update = getDb().prepare(
    'UPDATE tasks SET position = ?, updated_at = ? WHERE id = ? AND project_id = ?'
  )
  const run = getDb().transaction((ids: string[]) => {
    const now = Date.now()
    ids.forEach((id, i) => update.run(i, now, id, projectId))
  })
  run(orderedIds)
}

// ── Dependencies ──────────────────────────────────────────

export function listDependencies(projectId: string) {
  return getDb()
    .prepare(
      `SELECT d.* FROM dependencies d
       JOIN tasks t ON d.task_id = t.id
       WHERE t.project_id = ?`
    )
    .all(projectId)
}

export function createDependency(taskId: string, dependsOnId: string) {
  const id = randomUUID()
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO dependencies (id, task_id, depends_on_id, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(id, taskId, dependsOnId, Date.now())
}

export function deleteDependency(taskId: string, dependsOnId: string) {
  getDb()
    .prepare('DELETE FROM dependencies WHERE task_id = ? AND depends_on_id = ?')
    .run(taskId, dependsOnId)
}
