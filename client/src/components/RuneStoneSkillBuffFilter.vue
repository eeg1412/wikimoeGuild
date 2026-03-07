<template>
  <div class="flex flex-wrap gap-2">
    <!-- 主动技能筛选 -->
    <el-popover
      v-model:visible="skillVisible"
      :width="200"
      trigger="manual"
      placement="bottom-start"
      popper-class="skill-filter-popover"
    >
      <template #reference>
        <button
          class="filter-select-btn"
          :class="{
            'filter-select-btn--active':
              skillMode !== '' && skillSelected.size > 0
          }"
          @click="skillVisible = !skillVisible"
        >
          ⚔️ 主动技能
          <span
            v-if="skillMode !== '' && skillSelected.size > 0"
            class="filter-badge"
            >{{ skillSelected.size }}</span
          >
          <span class="filter-arrow">▼</span>
        </button>
      </template>
      <div>
        <el-radio-group
          v-model="pendingSkillMode"
          size="small"
          class="flex gap-2 flex-wrap"
        >
          <el-radio value="and">与</el-radio>
          <el-radio value="or">或</el-radio>
          <el-radio value="not">非</el-radio>
        </el-radio-group>
        <div
          class="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2 space-y-1"
        >
          <div
            v-for="item in skillTypeOptions"
            :key="item.value"
            class="flex items-center gap-2 px-1 py-0.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm select-none"
            :class="
              pendingSkillSelected.has(item.value)
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="toggleSkillItem(item.value)"
          >
            <span
              class="w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-xs shrink-0"
              :class="
                pendingSkillSelected.has(item.value)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-400 dark:border-gray-500 text-transparent'
              "
              >✓</span
            >
            {{ item.label }}
          </div>
        </div>
        <div
          class="flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600"
        >
          <el-button size="small" @click="resetSkill">重置</el-button>
          <el-button size="small" type="primary" @click="confirmSkill"
            >确定</el-button
          >
        </div>
      </div>
    </el-popover>

    <!-- 被动增益筛选 -->
    <el-popover
      v-model:visible="buffVisible"
      :width="200"
      trigger="manual"
      placement="bottom-start"
      popper-class="skill-filter-popover"
    >
      <template #reference>
        <button
          class="filter-select-btn"
          :class="{
            'filter-select-btn--active':
              buffMode !== '' && buffSelected.size > 0
          }"
          @click="buffVisible = !buffVisible"
        >
          🛡️ 被动增益
          <span
            v-if="buffMode !== '' && buffSelected.size > 0"
            class="filter-badge"
            >{{ buffSelected.size }}</span
          >
          <span class="filter-arrow">▼</span>
        </button>
      </template>
      <div>
        <el-radio-group
          v-model="pendingBuffMode"
          size="small"
          class="flex gap-2 flex-wrap"
        >
          <el-radio value="and">与</el-radio>
          <el-radio value="or">或</el-radio>
          <el-radio value="not">非</el-radio>
        </el-radio-group>
        <div
          class="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2 space-y-1"
        >
          <div
            v-for="item in buffTypeOptions"
            :key="item.value"
            class="flex items-center gap-2 px-1 py-0.5 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm select-none"
            :class="
              pendingBuffSelected.has(item.value)
                ? 'text-blue-500 font-medium'
                : 'text-gray-700 dark:text-gray-300'
            "
            @click="toggleBuffItem(item.value)"
          >
            <span
              class="w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-xs shrink-0"
              :class="
                pendingBuffSelected.has(item.value)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-400 dark:border-gray-500 text-transparent'
              "
              >✓</span
            >
            {{ item.label }}
          </div>
        </div>
        <div
          class="flex gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600"
        >
          <el-button size="small" @click="resetBuff">重置</el-button>
          <el-button size="small" type="primary" @click="confirmBuff"
            >确定</el-button
          >
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const skillTypeOptions = [
  { value: 'attack', label: '攻击' },
  { value: 'buff', label: '增益' },
  { value: 'debuff', label: '减益' },
  { value: 'changeOrder', label: '改变排序' },
  { value: 'sanRecover', label: 'SAN恢复' }
]
const buffTypeOptions = [
  { value: 'attack', label: '攻击增益' },
  { value: 'defense', label: '防御增益' },
  { value: 'speed', label: '速度增益' },
  { value: 'san', label: 'SAN增益' }
]

const props = defineProps({
  skillMode: { type: String, default: '' },
  skillSelected: { type: Set, default: () => new Set() },
  buffMode: { type: String, default: '' },
  buffSelected: { type: Set, default: () => new Set() }
})

const emit = defineEmits(['change'])

const skillVisible = ref(false)
const buffVisible = ref(false)
const pendingSkillMode = ref('')
const pendingSkillSelected = ref(new Set())
const pendingBuffMode = ref('')
const pendingBuffSelected = ref(new Set())

watch(skillVisible, val => {
  if (val) {
    pendingSkillMode.value = props.skillMode || 'or'
    pendingSkillSelected.value = new Set(props.skillSelected)
  }
})
watch(buffVisible, val => {
  if (val) {
    pendingBuffMode.value = props.buffMode || 'or'
    pendingBuffSelected.value = new Set(props.buffSelected)
  }
})

function toggleSkillItem(type) {
  const s = new Set(pendingSkillSelected.value)
  if (s.has(type)) s.delete(type)
  else s.add(type)
  pendingSkillSelected.value = s
}
function toggleBuffItem(type) {
  const s = new Set(pendingBuffSelected.value)
  if (s.has(type)) s.delete(type)
  else s.add(type)
  pendingBuffSelected.value = s
}

function confirmSkill() {
  skillVisible.value = false
  const hasItem = pendingSkillSelected.value.size > 0
  emit('change', {
    skillMode: hasItem ? pendingSkillMode.value || 'or' : '',
    skillSelected: hasItem ? new Set(pendingSkillSelected.value) : new Set(),
    buffMode: props.buffMode,
    buffSelected: new Set(props.buffSelected)
  })
}
function confirmBuff() {
  buffVisible.value = false
  const hasItem = pendingBuffSelected.value.size > 0
  emit('change', {
    skillMode: props.skillMode,
    skillSelected: new Set(props.skillSelected),
    buffMode: hasItem ? pendingBuffMode.value || 'or' : '',
    buffSelected: hasItem ? new Set(pendingBuffSelected.value) : new Set()
  })
}
function resetSkill() {
  skillVisible.value = false
  emit('change', {
    skillMode: '',
    skillSelected: new Set(),
    buffMode: props.buffMode,
    buffSelected: new Set(props.buffSelected)
  })
}
function resetBuff() {
  buffVisible.value = false
  emit('change', {
    skillMode: props.skillMode,
    skillSelected: new Set(props.skillSelected),
    buffMode: '',
    buffSelected: new Set()
  })
}
</script>

<style scoped>
.filter-select-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: var(--el-text-color-regular, #606266);
}
.filter-select-btn:hover {
  border-color: var(--el-color-primary, #409eff);
}
.filter-select-btn--active {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-size: 10px;
  background: var(--el-color-primary, #409eff);
  color: #fff;
  line-height: 1;
}
.filter-arrow {
  font-size: 10px;
  opacity: 0.5;
}
</style>
