<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTasks } from './composables/useTasks'
import { STATUSES } from './utils/constants'
import KanbanBoard from './components/KanbanBoard.vue'
import TaskForm from './components/TaskForm.vue'

const { tasks, addTask, removeTask, updateTask, moveTask, tasksByStatus, seedDemoData } = useTasks()

const dragOverStatus = ref('')
const draggingId = ref(null)
const editing = ref(null) // { task } 或 { status, task: null }，task:null 表示新建
const modalOpen = ref(false)

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
  modalOpen.value = true
}

function handleSave(payload) {
  if (editing.value && editing.value.task) {
    updateTask(editing.value.task.id, {
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      status: payload.status,
    })
  } else {
    addTask(payload)
  }
  closeModal()
}

function closeModal() {
  modalOpen.value = false
  editing.value = null
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
  const saved = localStorage.getItem(THEME_KEY)
  applyTheme(saved === 'dark' || (saved === null && window.matchMedia?.('(prefers-color-scheme: dark)').matches))
  seedDemoData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
    <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
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

    <main class="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-6 sm:px-6">
      <KanbanBoard
        v-for="status in STATUSES"
        :key="status"
        :status="status"
        :tasks="tasksByStatus(status)"
        :drag-over="dragOverStatus === status && draggingId"
        :editing-task="editing && editing.task && editing.task.status === status ? editing.task : null"
        @edit="handleEdit"
        @delete="handleDelete"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @drop="handleDrop"
      />
    </main>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
          <h2 class="mb-4 text-base font-semibold">
            {{ editing && editing.task ? '编辑任务' : '新建任务' }}
          </h2>
          <TaskForm
            v-if="editing"
            :initial="{
              title: editing.task ? editing.task.title : '',
              description: editing.task ? editing.task.description : '',
              priority: editing.task ? editing.task.priority : 'medium',
              status: editing.status || 'todo',
            }"
            @save="handleSave"
            @cancel="closeModal"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>