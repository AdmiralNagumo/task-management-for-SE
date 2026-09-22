<script setup>
import { ref, computed } from 'vue'
import PriorityBadge from './PriorityBadge.vue'

const props = defineProps({
  task: { type: Object, required: true },
  dragging: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete', 'dragstart', 'dragend'])

const menuOpen = ref(false)

const priorityBorder = {
  high: 'border-l-red-500 dark:border-l-red-400',
  medium: 'border-l-yellow-500 dark:border-l-yellow-400',
  low: 'border-l-green-500 dark:border-l-green-400',
}

const cardClass = computed(() =>
  [
    'group rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition',
    'hover:shadow-md hover:-translate-y-0.5',
    'dark:border-gray-700 dark:bg-gray-800',
    priorityBorder[props.task.priority],
    'cursor-grab active:cursor-grabbing',
    props.dragging ? 'opacity-50 ring-2 ring-indigo-300 dark:ring-indigo-500/60' : 'opacity-100',
  ].join(' '),
)

function onDragStart(event) {
  emit('dragstart', props.task.id)
  event.dataTransfer.effectAllowed = 'move'
  try {
    event.dataTransfer.setData('text/plain', props.task.id)
  } catch {
    // 某些环境不支持 setData，忽略
  }
}

function onDragEnd() {
  emit('dragend')
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}
</script>

<template>
  <article
    :class="cardClass"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="menuOpen = false"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ task.title }}</p>
        <p v-if="task.description" class="mt-1 whitespace-pre-wrap text-xs text-gray-500 dark:text-gray-400">
          {{ task.description }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <PriorityBadge :model-value="task.priority" @update:model-value="emit('edit', { task, patch: { priority: $event } })" />
        <div class="relative">
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title="更多操作"
            aria-label="更多操作"
            @click.stop="toggleMenu"
          >
            <span class="text-base leading-none">⋯</span>
          </button>
          <div
            v-if="menuOpen"
            class="absolute right-0 top-7 z-10 w-32 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
            @click.stop
          >
            <button
              type="button"
              class="block w-full px-3 py-1.5 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="emit('edit', { task })"
            >
              编辑
            </button>
            <button
              type="button"
              class="block w-full px-3 py-1.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              @click="emit('delete', task)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>