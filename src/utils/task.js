import { PRIORITIES, STATUSES } from './constants'

let counter = 0

export function createTask({ title, description = '', priority = 'medium', status = 'todo' }) {
  const cleanTitle = String(title ?? '').trim()
  if (!cleanTitle) {
    throw new Error('任务标题不能为空')
  }
  if (!STATUSES.includes(status)) {
    throw new Error(`无效的状态: ${status}`)
  }
  if (!PRIORITIES.includes(priority)) {
    throw new Error(`无效的优先级: ${priority}`)
  }
  counter += 1
  return {
    id: `task-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 8)}`,
    title: cleanTitle,
    description: String(description ?? '').trim(),
    priority,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function parseTasks(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        item.title.trim() &&
        STATUSES.includes(item.status) &&
        PRIORITIES.includes(item.priority),
    )
    .map((item) => ({
      id: item.id,
      title: item.title.trim(),
      description: typeof item.description === 'string' ? item.description : '',
      priority: item.priority,
      status: item.status,
      createdAt: Number(item.createdAt) || Date.now(),
      updatedAt: Number(item.updatedAt) || Date.now(),
    }))
}