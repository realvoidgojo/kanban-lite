import { supabase } from './supabaseClient'

// Hash a password using Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify a password against a hash
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

const createSessionData = (team, user = null) => ({
  team,
  user,
  loginTime: new Date().toISOString()
})

const storeSession = (sessionData) => {
  localStorage.setItem('trello_session', JSON.stringify(sessionData))
  console.log('Session stored:', { team: sessionData.team?.name, user: sessionData.user?.name })
}

// Register a new team (creates team only, no initial user)
export async function registerTeam(teamName, teamPassword) {
  try {
    // Check if team name already exists
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', teamName)
      .single()

    if (existingTeam) {
      throw new Error('Team name already exists')
    }

    // Hash the team password
    const hashedTeamPassword = await hashPassword(teamPassword)

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([
        { name: teamName, password_hash: hashedTeamPassword }
      ])
      .select()
      .single()

    if (teamError) throw teamError

    // Store session with team info only
    const sessionData = createSessionData(team)
    storeSession(sessionData)

    return sessionData
  } catch (error) {
    throw error
  }
}

// Login with team credentials only
export async function loginTeam(teamName, teamPassword) {
  try {
    console.log('Login attempt for team:', teamName)
    
    // Find the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('name', teamName)
      .single()

    if (teamError || !team) {
      throw new Error('Team not found')
    }

    // Verify team password
    const isValidPassword = await verifyPassword(teamPassword, team.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid team password')
    }

    console.log('Team authenticated, fetching members...')

    // Get team members to see if we should auto-select one
    const { data: teamMembers } = await supabase
      .from('users')
      .select('*')
      .eq('team_id', team.id)
      .order('created_at', { ascending: true })
      .limit(1)

    // Auto-select the first user if available, otherwise leave user as null
    const firstUser = teamMembers && teamMembers.length > 0 ? teamMembers[0] : null

    console.log('Team members found:', teamMembers?.length || 0, 'First user:', firstUser?.name)

    // Store session with team info only
    const sessionData = createSessionData(team, firstUser)
    storeSession(sessionData)

    console.log('Login successful, session created')
    return sessionData
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

// Switch to a specific team member (used when viewing their board)
export async function switchToMember(memberName) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    // Find the member in the team
    const { data: member, error: memberError } = await supabase
      .from('users')
      .select('*')
      .eq('team_id', session.team.id)
      .eq('name', memberName)
      .single()

    if (memberError) throw memberError

    // Update session with current member
    const updatedSession = {
      ...session,
      user: member
    }
    
    storeSession(updatedSession)

    return updatedSession
  } catch (error) {
    throw error
  }
}

// Add a new member to the current team
export async function addTeamMember(userName) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    // Check if user already exists in team
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('team_id', session.team.id)
      .eq('name', userName)
      .single()

    if (existingUser) {
      throw new Error('User with this name already exists in the team')
    }

    // Create new user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        { 
          name: userName, 
          team_id: session.team.id 
        }
      ])
      .select()
      .single()

    if (userError) throw userError

    return newUser
  } catch (error) {
    throw error
  }
}

// Get current session from localStorage
export function getCurrentSession() {
  try {
    const sessionData = localStorage.getItem('trello_session')
    if (!sessionData) return null
    
    return JSON.parse(sessionData)
  } catch (error) {
    return null
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  const session = getCurrentSession()
  const authenticated = !!session && !!session.team
  console.log('Auth check:', { hasSession: !!session, hasTeam: !!session?.team, authenticated })
  return authenticated
}

// Logout user
export function logout() {
  localStorage.removeItem('trello_session')
  console.log('User logged out')
}

// Get current user data
export function getCurrentUser() {
  const session = getCurrentSession()
  if (!session) return null
  
  return {
    user: session.user,
    team: session.team,
    userProfile: session.user
  }
}

// Mock auth state change (for compatibility with existing AuthContext)
export function onAuthStateChange(callback) {
  // For simplicity, we'll just check localStorage periodically
  const checkAuth = () => {
    const session = getCurrentSession()
    if (session) {
      callback('SIGNED_IN', session)
    } else {
      callback('SIGNED_OUT', null)
    }
  }
  
  // Initial check
  checkAuth()
  
  // Check every 5 seconds for changes (simple implementation)
  const interval = setInterval(checkAuth, 5000)
  
  return {
    data: {
      subscription: {
        unsubscribe: () => clearInterval(interval)
      }
    }
  }
} 