<template>
  <div class="w-full relative" :style="[dungeonBgStyle, { minHeight: '70vh' }]">
    <!-- 遮罩层 -->
    <div class="absolute inset-0 bg-black/60 z-0" />

    <!-- 内容层 -->
    <div class="relative z-10 py-6 px-4 max-w-lg mx-auto">
      <!-- 标题 -->
      <div class="text-center mb-6">
        <h1
          class="rpg-dungeon-title text-2xl font-bold text-yellow-300 drop-shadow-lg"
        >
          🏰 地下迷宫
        </h1>
        <p class="text-gray-300 text-sm mt-1">
          迷宫等级 Lv.{{ playerInfo?.dungeonsLevel || 1 }}
        </p>
      </div>

      <!-- 迷宫信息卡 -->
      <div class="dungeon-card rounded-2xl p-5 mb-4">
        <h3
          class="text-yellow-300 font-semibold text-sm mb-3 flex items-center gap-2"
        >
          <span>💎</span> 水晶爆率
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="cry in crystalRates"
            :key="cry.key"
            class="crystal-item flex flex-col items-center p-2 rounded-lg"
            :style="{ borderColor: cry.color + '80' }"
          >
            <span class="text-lg">{{ cry.icon }}</span>
            <span class="text-xs text-gray-300 mt-0.5">{{ cry.name }}水晶</span>
            <span
              class="text-base font-bold mt-1"
              :style="{ color: cry.color }"
            >
              {{ cry.rate }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 产出信息卡 -->
      <div class="dungeon-card rounded-2xl p-5 mb-4">
        <h3
          class="text-yellow-300 font-semibold text-sm mb-3 flex items-center gap-2"
        >
          <span>⚗️</span> 产出信息
        </h3>
        <div class="space-y-3">
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">冒险家数量</span>
            <span class="text-white font-semibold rpg-num">{{
              adventurerCount
            }}</span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">水晶产出率</span>
            <span class="text-yellow-300 font-bold rpg-num">{{
              productionRate
            }}</span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">当前产物数量</span>
            <span
              class="text-green-300 font-bold text-lg rpg-num counting-animation"
            >
              {{ currentOutput }}
            </span>
          </div>
          <div class="dungeon-info-row">
            <span class="text-gray-300 text-sm">上次结算时间</span>
            <span class="text-gray-400 text-xs">{{ lastSettleStr }}</span>
          </div>
        </div>
      </div>

      <!-- 收取按钮（预留，暂不实现） -->
      <div class="text-center mt-6">
        <el-button type="warning" size="large" round disabled class="rpg-btn">
          ✨ 收取水晶（施工中）
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameUser } from '@/composables/useGameUser.js'

const router = useRouter()
const { isLoggedIn, playerInfo } = useGameUser()

if (!isLoggedIn.value) {
  router.replace('/game/login')
}

// 背景
const dungeonBgStyle = computed(() => {
  const bgId = playerInfo.value?.dungeonsBackgroundId || 1
  return {
    backgroundImage: `url(/publicgame/dungeons/${bgId}.webp)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
})

// 冒险家数量
const adventurerCount = computed(() => playerInfo.value?.adventurerCount || 0)

// 水晶爆率
const crystalRates = computed(() => {
  const rates = playerInfo.value?.dungeonsCryRates || {
    attackCryRate: 2500,
    defenseCryRate: 2500,
    speedCryRate: 2500,
    SANCryRate: 2500
  }
  return [
    {
      key: 'attack',
      name: '攻击',
      icon: '⚔️',
      color: '#e05c4f',
      rate: (rates.attackCryRate / 100).toFixed(0)
    },
    {
      key: 'defense',
      name: '防御',
      icon: '🛡️',
      color: '#4fa3e0',
      rate: (rates.defenseCryRate / 100).toFixed(0)
    },
    {
      key: 'speed',
      name: '速度',
      icon: '💨',
      color: '#6abf69',
      rate: (rates.speedCryRate / 100).toFixed(0)
    },
    {
      key: 'san',
      name: 'SAN值',
      icon: '🌀',
      color: '#c070e0',
      rate: (rates.SANCryRate / 100).toFixed(0)
    }
  ]
})

// 产出率：adventurerCount*100% + (adventurerCount-1)*10%，最大 2750%
const productionRate = computed(() => {
  const cnt = adventurerCount.value
  if (cnt <= 0) return '0%'
  const rate = cnt * 100 + (cnt - 1) * 10
  const capped = Math.min(rate, 2750)
  return `${capped}%`
})

// 结算时间字符串
const lastSettleStr = computed(() => {
  const d = playerInfo.value?.lastDungeonSettleAt
  if (!d) return '—'
  return new Date(d).toLocaleString('zh-CN')
})

// 当前产物数量（每分钟+1，定时刷新）
const currentOutput = ref(0)
let outputTimer = null

function calcOutput() {
  const settleAt = playerInfo.value?.lastDungeonSettleAt
  if (!settleAt) {
    currentOutput.value = 0
    return
  }
  const ms = Date.now() - new Date(settleAt).getTime()
  currentOutput.value = Math.floor(ms / 60000)
}

onMounted(() => {
  calcOutput()
  outputTimer = setInterval(calcOutput, 5000)
})

onUnmounted(() => {
  if (outputTimer) {
    clearInterval(outputTimer)
    outputTimer = null
  }
})
</script>

<style scoped>
.rpg-dungeon-title {
  font-family: serif;
  animation: dungeonTitleGlow 3s ease-in-out infinite;
  letter-spacing: 0.1em;
}

@keyframes dungeonTitleGlow {
  0%,
  100% {
    text-shadow:
      0 0 10px rgba(255, 200, 50, 0.5),
      0 0 20px rgba(255, 150, 0, 0.3);
  }
  50% {
    text-shadow:
      0 0 20px rgba(255, 200, 50, 0.9),
      0 0 40px rgba(255, 150, 0, 0.6);
  }
}

.dungeon-card {
  background: rgba(10, 8, 20, 0.75);
  border: 1px solid rgba(200, 160, 80, 0.3);
  backdrop-filter: blur(8px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.crystal-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid;
  transition: transform 0.2s ease;
}

.crystal-item:hover {
  transform: scale(1.05);
}

.dungeon-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dungeon-info-row:last-child {
  border-bottom: none;
}

.rpg-num {
  font-family: 'monospace';
  letter-spacing: 0.05em;
}

.counting-animation {
  animation: countUp 0.3s ease-out;
}

@keyframes countUp {
  from {
    transform: scale(1.2);
    color: #fff;
  }
  to {
    transform: scale(1);
  }
}

.rpg-btn {
  font-size: 1rem;
  letter-spacing: 0.1em;
  padding: 12px 32px;
}
</style>
