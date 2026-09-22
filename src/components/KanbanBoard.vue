<script setup>
import { computed } from 'vue'
import { STATUS_LABELS } from '../utils/constants'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  status: { type: String, required: true },
  tasks: { type: Array, required: true },
  dragOver: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete', 'dragstart', 'dragend', 'dragover', 'dragleave', 'drop'])

const headerStyles = {
  todo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  doing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
}

const columnClass = computed(() =>
  [
    'flex min-h-[320px] w-full flex-1 flex-col gap-3 rounded-xl border p-3 transition',
    'border-gray-200 bg-gray-50 dark:border-gray-700/70 dark:bg-gray-800/40',
    props.dragOver ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/15' : '',
  ].join(' '),
)

function onDrop(event) {
  const id =
    event.dataTransfer?.getData('text/plain') ||
    event.dataTransfer?.getData('text') ||
    ''
  if (id) {
    emit('drop', { id, status: props.status })
  }
}
</script>

<template>
  <section
    :class="columnClass"
    role="list"
    :aria-label="STATUS_LABELS[status]"
    @dragover.prevent="emit('dragover', status)"
    @dragleave="emit('dragleave', status)"
    @drop.prevent="onDrop"
  >
    <header class="flex items-center justify-between px-1">
      <h2 class="flex items-center gap-2 text-sm font-semibold" :class="headerStyles[status]">
        <span
          class="inline-block h-2 w-2 rounded-full"
          :class="{
            'bg-gray-400 dark:bg-gray-500': status === 'todo',
            'bg-blue-500': status === 'doing',
            'bg-green-500': status === 'done',
          }"
        ></span>
        {{ STATUS_LABELS[status] }}
        <span class="rounded-full bg-white/70 px-1.5 py-0.5 text-xs font-normal text-gray-500 dark:bg-white/10 dark:text-gray-300">
          {{ tasks.length }}
        </span>
      </h2>
    </header>

    <div class="flex flex-1 flex-col gap-3">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @dragstart="emit('dragstart', $event)"
        @dragend="emit('dragend')"
      />

      <button
        type="button"
        class="flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-400"
        @click="emit('edit', { status, task: null })"
      >
        + 添加任务
      </button>
    </div>
  </section>
</template>