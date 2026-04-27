<template>
  <img
    class="pixel-icon"
    :class="{ 'pixel-icon--inline': inline }"
    :src="iconSrc"
    :alt="title || resolvedName"
    :title="title || undefined"
    :style="iconStyle"
    loading="lazy"
    decoding="async"
  />
</template>

<script setup>
import { computed } from 'vue'

import guildHallUrl from '@/assets/pixel-icons/guild-hall.png'
import adventurerUrl from '@/assets/pixel-icons/adventurer.png'
import dungeonCastleUrl from '@/assets/pixel-icons/dungeon-castle.png'
import runeGemUrl from '@/assets/pixel-icons/rune-gem.png'
import formationGridUrl from '@/assets/pixel-icons/formation-grid.png'
import inventoryBagUrl from '@/assets/pixel-icons/inventory-bag.png'
import mailEnvelopeUrl from '@/assets/pixel-icons/mail-envelope.png'
import marketStallUrl from '@/assets/pixel-icons/market-stall.png'
import arenaTrophyUrl from '@/assets/pixel-icons/arena-trophy.png'
import minePickaxeUrl from '@/assets/pixel-icons/mine-pickaxe.png'
import guideBookUrl from '@/assets/pixel-icons/guide-book.png'
import attackSwordUrl from '@/assets/pixel-icons/attack-sword.png'
import defenseShieldUrl from '@/assets/pixel-icons/defense-shield.png'
import speedWindUrl from '@/assets/pixel-icons/speed-wind.png'
import sanHeartUrl from '@/assets/pixel-icons/san-heart.png'
import fireElementUrl from '@/assets/pixel-icons/fire-element.png'
import waterElementUrl from '@/assets/pixel-icons/water-element.png'
import windElementUrl from '@/assets/pixel-icons/wind-element.png'
import earthStoneUrl from '@/assets/pixel-icons/earth-stone.png'
import lightSunUrl from '@/assets/pixel-icons/light-sun.png'
import darkMoonUrl from '@/assets/pixel-icons/dark-moon.png'
import goldCoinUrl from '@/assets/pixel-icons/gold-coin.png'
import giftBoxUrl from '@/assets/pixel-icons/gift-box.png'
import noticeMegaphoneUrl from '@/assets/pixel-icons/notice-megaphone.png'

const props = defineProps({
  name: { type: String, default: 'guild' },
  size: { type: [Number, String], default: null },
  title: { type: String, default: '' },
  inline: { type: Boolean, default: true }
})

const aliases = {
  guild: 'guild-hall',
  home: 'guild-hall',
  hall: 'guild-hall',
  adventurer: 'adventurer',
  player: 'adventurer',
  hero: 'adventurer',
  dungeon: 'dungeon-castle',
  castle: 'dungeon-castle',
  rune: 'rune-gem',
  gem: 'rune-gem',
  diamond: 'rune-gem',
  fragment: 'rune-gem',
  synthesis: 'rune-gem',
  dice: 'rune-gem',
  formation: 'formation-grid',
  grid: 'formation-grid',
  drag: 'formation-grid',
  plus: 'formation-grid',
  inventory: 'inventory-bag',
  backpack: 'inventory-bag',
  bag: 'inventory-bag',
  package: 'inventory-bag',
  material: 'inventory-bag',
  mail: 'mail-envelope',
  email: 'mail-envelope',
  download: 'mail-envelope',
  timer: 'mail-envelope',
  hourglass: 'mail-envelope',
  calendar: 'mail-envelope',
  market: 'market-stall',
  shop: 'market-stall',
  buy: 'market-stall',
  sell: 'market-stall',
  official: 'guild-hall',
  arena: 'arena-trophy',
  trophy: 'arena-trophy',
  mine: 'mine-pickaxe',
  pickaxe: 'mine-pickaxe',
  guide: 'guide-book',
  book: 'guide-book',
  chart: 'guide-book',
  stats: 'guide-book',
  list: 'guide-book',
  copy: 'guide-book',
  search: 'guide-book',
  settings: 'guide-book',
  edit: 'guide-book',
  attack: 'attack-sword',
  sword: 'attack-sword',
  skill: 'attack-sword',
  defense: 'defense-shield',
  shield: 'defense-shield',
  passive: 'defense-shield',
  lock: 'defense-shield',
  speed: 'speed-wind',
  up: 'speed-wind',
  down: 'speed-wind',
  expand: 'speed-wind',
  collapse: 'speed-wind',
  san: 'san-heart',
  heart: 'san-heart',
  heal: 'san-heart',
  fire: 'fire-element',
  water: 'water-element',
  wind: 'wind-element',
  earth: 'earth-stone',
  stone: 'earth-stone',
  light: 'light-sun',
  sun: 'light-sun',
  star: 'light-sun',
  spark: 'light-sun',
  check: 'light-sun',
  success: 'light-sun',
  online: 'light-sun',
  crown: 'light-sun',
  dark: 'dark-moon',
  moon: 'dark-moon',
  enemy: 'dark-moon',
  fail: 'dark-moon',
  offline: 'dark-moon',
  gold: 'gold-coin',
  coin: 'gold-coin',
  money: 'gold-coin',
  price: 'gold-coin',
  gift: 'gift-box',
  reward: 'gift-box',
  notice: 'notice-megaphone',
  notification: 'notice-megaphone',
  megaphone: 'notice-megaphone',
  warning: 'notice-megaphone',
  info: 'notice-megaphone',
  tag: 'notice-megaphone',
  pin: 'notice-megaphone',
  close: 'notice-megaphone',
  trash: 'notice-megaphone',
  unknown: 'guide-book'
}

const iconUrls = {
  'guild-hall': guildHallUrl,
  adventurer: adventurerUrl,
  'dungeon-castle': dungeonCastleUrl,
  'rune-gem': runeGemUrl,
  'formation-grid': formationGridUrl,
  'inventory-bag': inventoryBagUrl,
  'mail-envelope': mailEnvelopeUrl,
  'market-stall': marketStallUrl,
  'arena-trophy': arenaTrophyUrl,
  'mine-pickaxe': minePickaxeUrl,
  'guide-book': guideBookUrl,
  'attack-sword': attackSwordUrl,
  'defense-shield': defenseShieldUrl,
  'speed-wind': speedWindUrl,
  'san-heart': sanHeartUrl,
  'fire-element': fireElementUrl,
  'water-element': waterElementUrl,
  'wind-element': windElementUrl,
  'earth-stone': earthStoneUrl,
  'light-sun': lightSunUrl,
  'dark-moon': darkMoonUrl,
  'gold-coin': goldCoinUrl,
  'gift-box': giftBoxUrl,
  'notice-megaphone': noticeMegaphoneUrl
}

const resolvedName = computed(() => aliases[props.name] || props.name || 'guild-hall')
const iconSrc = computed(() => iconUrls[resolvedName.value] || guildHallUrl)
const iconStyle = computed(() => {
  if (!props.size) return null
  const value = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { width: value, height: value }
})
</script>

<style scoped>
.pixel-icon {
  display: inline-block;
  width: 1.25em;
  height: 1.25em;
  object-fit: contain;
  image-rendering: pixelated;
  vertical-align: -0.25em;
  flex: 0 0 auto;
}

.pixel-icon--inline {
  display: inline-block;
}
</style>
