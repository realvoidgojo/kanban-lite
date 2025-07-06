import { supabase } from './supabaseClient'
import { getCurrentSession } from './authService'

// Get all team members
export async function getTeamMembers(teamId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        created_at
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

// Get current user's team members
export async function getCurrentTeamMembers() {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    return await getTeamMembers(session.team.id)
  } catch (error) {
    throw error
  }
}

// Switch to a specific team member (for viewing their board)
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
    
    localStorage.setItem('trello_session', JSON.stringify(updatedSession))

    return updatedSession
  } catch (error) {
    throw error
  }
}

// Get team details
export async function getTeamDetails(teamId) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        created_at
      `)
      .eq('id', teamId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

// Search team members by name
export async function searchTeamMembers(query) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        created_at
      `)
      .eq('team_id', session.team.id)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

// Get user by name within team
export async function getUserByName(name) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        created_at
      `)
      .eq('team_id', session.team.id)
      .ilike('name', name)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

// Remove a team member and all their tasks
export async function removeTeamMember(userId) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    // First verify the user belongs to the current team
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, team_id')
      .eq('id', userId)
      .eq('team_id', session.team.id)
      .single()

    if (userError) throw new Error('User not found or access denied')

    // Delete all tasks for this user (CASCADE will handle this automatically)
    // But we'll do it explicitly for clarity
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId)

    if (tasksError) throw tasksError

    // Delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) throw deleteError

    return { success: true, deletedUser: user }
  } catch (error) {
    throw error
  }
}

// Subscribe to team member changes
export function subscribeToTeamChanges(teamId, callback) {
  return supabase
    .channel('team-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'users',
        filter: `team_id=eq.${teamId}`
      }, 
      callback
    )
    .subscribe()
} 