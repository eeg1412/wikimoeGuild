import mongoose from 'mongoose'

const blogPostSchema = new mongoose.Schema(
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

blogPostSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v
    return ret
  },
})

const BlogPost = mongoose.model('BlogPost', blogPostSchema)

export default BlogPost
