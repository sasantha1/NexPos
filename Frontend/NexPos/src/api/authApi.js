import { apiRequest } from './client'

async function login(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

async function me() {
  return apiRequest('/auth/me', { auth: true })
}

export { login, me }

