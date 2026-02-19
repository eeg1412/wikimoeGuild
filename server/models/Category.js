import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

categorySchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v
    return ret
  },
})

const Category = mongoose.model('Category', categorySchema)

export default Category
