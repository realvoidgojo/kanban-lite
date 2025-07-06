import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { getCurrentUser, logout, isAuthenticated } from '../services/authService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const checkAuthState = () => {
    const currentUser = getCurrentUser()
    const isAuth = isAuthenticated()
    
    if (currentUser && isAuth) {
      setUser(currentUser.user)
      setUserProfile(currentUser.userProfile)
      setTeam(currentUser.team)
    } else {
      setUser(null)
      setUserProfile(null)
      setTeam(null)
    }
    setLoading(false)
  }

  const forceAuthCheck = () => {
    // Force immediate auth check and state update
    setTimeout(checkAuthState, 0)
  }

  useEffect(() => {
    checkAuthState()

    const handleStorageChange = (e) => {
      if (e.key === 'trello_session') {
        // Force immediate check on storage change
        setTimeout(checkAuthState, 0)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Reduce interval frequency to avoid race conditions
    intervalRef.current = setInterval(checkAuthState, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const signOut = async () => {
    try {
      logout()
      setUser(null)
      setUserProfile(null)
      setTeam(null)
      checkAuthState()
    } catch (error) {
      // Sign out failed - handle gracefully
    }
  }

  const value = {
    user,
    userProfile,
    team,
    loading,
    signOut,
    isAuthenticated: !!team,
    isInTeam: !!team,
    refreshAuth: forceAuthCheck
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 