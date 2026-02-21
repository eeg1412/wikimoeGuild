import mongoose from 'mongoose'

const adminOptionSchema = new mongoose.Schema(
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
  { timestamps: true }
)

const adminOption = mongoose.model('admin_options', adminOptionSchema)

export default adminOption
