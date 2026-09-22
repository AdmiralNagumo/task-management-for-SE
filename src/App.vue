<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useTasks } from './composables/useTasks'
import { STATUSES } from './utils/constants'
import KanbanBoard from './components/KanbanBoard.vue'
import TaskForm from './components/TaskForm.vue'

const { tasks, addTask, removeTask, updateTask, moveTask, tasksByStatus, seedDemoData } = useTasks()

const dragOverStatus = ref('')
const draggingId = ref(null)
const editing = ref(null) // { task } 或 { status, task: null }，task:null 表示新建
const modalOpen = ref(false)
const dialog = ref(null)
const saveError = ref('')
let previousFocus = null

const isDark = ref(false)
const THEME_KEY = 'task-management:theme'

function applyTheme(dark) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
}

function toggleTheme() {
  const next = !isDark.value
  applyTheme(next)
  try {
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
  } catch (error) {
    console.warn('保存主题失败', error)
  }
}

function handleEdit(payload) {
  if (payload.patch) {
    updateTask(payload.task.id, payload.patch)
    return
  }
  if (payload.task) {
    editing.value = { task: payload.task }
  } else {
    editing.value = { status: payload.status, task: null }
  }
  previousFocus = document.activeElement?.closest('article')?.querySelector('button[aria-label="更多操作"]') || document.activeElement
  saveError.value = ''
  modalOpen.value = true
}

function handleSave(payload) {
  try {
    if (editing.value && editing.value.task) {
      updateTask(editing.value.task.id, payload)
    } else {
      addTask(payload)
    }
    closeModal()
  } catch (error) {
    saveError.value = error.message || '保存失败，请重试'
  }
}

function closeModal() {
  modalOpen.value = false
  editing.value = null
  saveError.value = ''
  nextTick(() => previousFocus?.focus())
}

function handleDialogKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeModal()
  }
  if (event.key !== 'Tab') return
  const controls = dialog.value?.querySelectorAll('button, input, textarea, select, [tabindex="0"]')
  if (!controls?.length) return
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function handleDelete(task) {
  if (window.confirm(`确定删除任务「${task.title}」吗？`)) {
    removeTask(task.id)
  }
}

function handleDragStart(id) {
  draggingId.value = id
}

function handleDragEnd() {
  draggingId.value = null
  dragOverStatus.value = ''
}

function handleDragOver(status) {
  dragOverStatus.value = status
}

function handleDrop({ id, status }) {
  moveTask(id, status)
  handleDragEnd()
}

onMounted(() => {
  let saved = null
  try {
    saved = localStorage.getItem(THEME_KEY)
  } catch (error) {
    console.warn('读取主题失败', error)
  }
  applyTheme(saved === 'dark' || (saved !== 'light' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches))
  seedDemoData()
})
</script>

<template>
  <div class="app-root min-h-screen bg-gray-100 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
    <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <h1 class="text-lg font-bold">任务管理</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ tasks.length }} 个任务</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleTheme"
        >
          {{ isDark ? '☀️ 浅色' : '🌙 深色' }}
        </button>
      </div>
    </header>

    <main class="mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 px-4 py-6 sm:px-6 lg:grid-cols-3">
      <KanbanBoard
        v-for="status in STATUSES"
        :key="status"
        :status="status"
        :tasks="tasksByStatus(status)"
        :drag-over="dragOverStatus === status && draggingId !== null"
        :dragging-id="draggingId"
        @edit="handleEdit"
        @delete="handleDelete"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @dragleave="dragOverStatus === $event && (dragOverStatus = '')"
        @drop="handleDrop"
      />
    </main>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeModal"
        @keydown="handleDialogKeydown"
      >
        <div ref="dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 text-gray-900 shadow-xl dark:bg-gray-900 dark:text-gray-100 dark:ring-1 dark:ring-gray-700/60">
          <h2 id="task-dialog-title" class="mb-4 text-base font-semibold">
            {{ editing && editing.task ? '编辑任务' : '新建任务' }}
          </h2>
          <TaskForm
            v-if="editing"
            :initial="{
              title: editing.task ? editing.task.title : '',
              description: editing.task ? editing.task.description : '',
              priority: editing.task ? editing.task.priority : 'medium',
              status: editing.task ? editing.task.status : editing.status || 'todo',
            }"
            @save="handleSave"
            @cancel="closeModal"
          />
          <p v-if="saveError" class="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">{{ saveError }}</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>
