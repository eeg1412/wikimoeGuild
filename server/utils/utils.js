import bcrypt from 'bcryptjs'

export function createBcryptStr(str) {
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(str, salt)
  return hash
}
