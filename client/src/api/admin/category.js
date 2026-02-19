import adminRequest from './request.js'

export function listCategoryApi(params) {
  return adminRequest.get('/category', { params })
}

export function getCategoryApi(id) {
  return adminRequest.get(`/category/${id}`)
}

export function createCategoryApi(data) {
  return adminRequest.post('/category', data)
}

export function updateCategoryApi(id, data) {
  return adminRequest.put(`/category/${id}`, data)
}

export function deleteCategoryApi(id) {
  return adminRequest.delete(`/category/${id}`)
}
