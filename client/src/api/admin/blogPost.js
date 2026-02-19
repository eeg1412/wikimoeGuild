import adminRequest from './request.js'

export function listBlogPostApi(params) {
  return adminRequest.get('/blog-post', { params })
}

export function getBlogPostApi(id) {
  return adminRequest.get(`/blog-post/${id}`)
}

export function createBlogPostApi(data) {
  return adminRequest.post('/blog-post', data)
}

export function updateBlogPostApi(id, data) {
  return adminRequest.put(`/blog-post/${id}`, data)
}

export function deleteBlogPostApi(id) {
  return adminRequest.delete(`/blog-post/${id}`)
}
