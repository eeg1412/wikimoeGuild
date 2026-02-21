import mongoose from 'mongoose'

const globalConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true
    },
    // value
    value: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

const GlobalConfig = mongoose.model('global_configs', globalConfigSchema)

export default GlobalConfig
