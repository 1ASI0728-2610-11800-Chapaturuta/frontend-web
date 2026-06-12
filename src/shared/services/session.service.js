export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

export function saveCurrentUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function getDriverId() {
  const user = getCurrentUser()
  return Number(user.driverId) || null
}

export function getUserId() {
  return Number(getCurrentUser().id) || null
}

export function clearSession() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
}
