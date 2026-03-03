export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createAdminSchema,
  updateAdminSchema
} from './adminAccountValidator.js'
export {
  createGlobalConfigSchema,
  updateGlobalConfigSchema,
  listGlobalConfigSchema
} from './globalConfigValidator.js'
export { installSchema } from './installValidator.js'
export {
  playerChangePasswordSchema,
  guestRegisterSchema,
  guestBindEmailSendCodeSchema,
  guestBindEmailSchema,
  sendCodeSchema,
  playerRegisterSchema,
  playerLoginSchema,
  resetPasswordSchema
} from './gameAuthValidator.js'
export {
  officialSellCrystalSchema,
  officialBuyCrystalSchema,
  officialSellRuneStoneSchema,
  officialSellRuneFragmentSchema,
  createMaterialSellOrderSchema,
  createMaterialBuyOrderSchema,
  fulfillMaterialOrderSchema,
  createRuneStoneListingSchema
} from './gameMarketValidator.js'
export {
  arenaRegisterSchema,
  arenaFormationUpdateSchema,
  arenaChallengeSchema
} from './gameArenaValidator.js'
export { saveFormationSchema } from './gameFormationValidator.js'
export {
  runeStonePreviewSynthesisSchema,
  runeStoneConfirmSynthesisSchema
} from './gameRuneStoneValidator.js'
export {
  adventurerCustomAvatarSchema,
  adventurerCustomNameSchema,
  adventurerLevelUpSchema,
  adventurerEquipRuneStoneSchema,
  adventurerRerollSchema,
  adventurerSetRoleTagSchema
} from './gameAdventurerValidator.js'
export {
  dungeonLegionChallengeSchema,
  dungeonSelectLevelSchema
} from './gameDungeonValidator.js'
export {
  changeGuildLogoSchema,
  changeGuildNameSchema
} from './gameGuildValidator.js'
export { mineDigSchema } from './gameMineValidator.js'
// ===GENERATOR_VALIDATOR===
