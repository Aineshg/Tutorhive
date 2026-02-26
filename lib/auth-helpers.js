// Helper functions to get user info from cookies

export function getUserIdFromCookie() {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('user-id='))
  
  if (userIdCookie) {
    return userIdCookie.split('=')[1].trim()
  }
  
  return null
}

export function getAuthTokenFromCookie() {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
  
  return authCookie ? authCookie.split('=')[1].trim() : null
}

