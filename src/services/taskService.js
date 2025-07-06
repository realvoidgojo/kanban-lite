import { supabase } from './supabaseClient'
import { getCurrentSession } from './authService'

const VALID_STATUSES = ['new', 'current', 'in_progress', 'completed']

const validateTaskData = (title, description, userId, status) => {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Task title is required and cannot be empty')
  }

  if (title.trim().length > 255) {
    throw new Error('Task title cannot exceed 255 characters')
  }

  if (description && typeof description !== 'string') {
    throw new Error('Task description must be a string')
  }

  if (description && description.length > 1000) {
    throw new Error('Task description cannot exceed 1000 characters')
  }

  if (!userId) {
    throw new Error('User ID is required')
  }

  if (status && !VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid task status. Must be one of: ${VALID_STATUSES.join(', ')}`)
  }
}

// Get all tasks for a specific user
export async function getUserTasks(userId) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        users!inner (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('team_id', session.team.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    throw error
  }
}

// Get current user's tasks
export async function getCurrentUserTasks() {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    return await getUserTasks(session.user.id)
  } catch (error) {
    console.error('Error fetching current user tasks:', error)
    throw error
  }
}

// Get all tasks for the current team
export async function getTeamTasks() {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        users (
          id,
          name
        )
      `)
      .eq('team_id', session.team.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching team tasks:', error)
    throw error
  }
}

// Create a new task
export async function createTask(title, description = '', userId = null, status = 'new') {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const targetUserId = userId || session.user?.id
    if (!targetUserId) {
      throw new Error('No user selected and no current user available')
    }

    validateTaskData(title, description, targetUserId, status)

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: title.trim(),
          description: description?.trim() || '',
          user_id: targetUserId,
          team_id: session.team.id,
          status: status
        }
      ])
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        users!inner (
          id,
          name
        )
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

// Update task status
export async function updateTaskStatus(taskId, newStatus) {
  try {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`)
    }

    return await updateTask(taskId, { status: newStatus })
  } catch (error) {
    throw error
  }
}

// Update task details
export async function updateTask(taskId, updates) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const allowedUpdates = ['title', 'description', 'status']
    const cleanUpdates = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        if (key === 'status' && !VALID_STATUSES.includes(value)) {
          throw new Error(`Invalid status: ${value}`)
        }
        if (key === 'title' || key === 'description') {
          cleanUpdates[key] = String(value).trim()
        } else {
          cleanUpdates[key] = value
        }
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error('No valid updates provided')
    }

    cleanUpdates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', taskId)
      .eq('team_id', session.team.id)
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        users!inner (
          id,
          name
        )
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    throw error
  }
}

// Delete a task
export async function deleteTask(taskId) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('team_id', session.team.id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    throw error
  }
}

// Search tasks across the team
export async function searchTasks(query, options = {}) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    const { userId, status, limit = 50 } = options

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return []
    }

    const searchQuery = query.trim()

    let supabaseQuery = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        users!inner (
          id,
          name
        )
      `)
      .eq('team_id', session.team.id)

    if (userId) {
      supabaseQuery = supabaseQuery.eq('user_id', userId)
    }

    if (status && VALID_STATUSES.includes(status)) {
      supabaseQuery = supabaseQuery.eq('status', status)
    }

    supabaseQuery = supabaseQuery
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    const { data, error } = await supabaseQuery

    if (error) throw error
    return data || []
  } catch (error) {
    throw error
  }
}

// Get tasks by status for a user
export async function getTasksByStatus(status, userId = null) {
  try {
    const session = getCurrentSession()
    if (!session) throw new Error('Not authenticated')

    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}`)
    }

    let supabaseQuery = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        users!inner (
          id,
          name
        )
      `)
      .eq('team_id', session.team.id)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (userId) {
      supabaseQuery = supabaseQuery.eq('user_id', userId)
    }

    const { data, error } = await supabaseQuery

    if (error) throw error
    return data || []
  } catch (error) {
    throw error
  }
}

// Get tasks organized by status for a user
export async function getTasksGroupedByStatus(userId) {
  try {
    const tasks = await getUserTasks(userId)
    
    const groupedTasks = {
      new: [],
      current: [],
      in_progress: [],
      completed: []
    }

    tasks.forEach(task => {
      if (groupedTasks[task.status]) {
        groupedTasks[task.status].push(task)
      }
    })

    return groupedTasks
  } catch (error) {
    throw error
  }
}

// Subscribe to task changes for a team
export function subscribeToTaskChanges(teamId, callback) {
  return supabase
    .channel('task-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `team_id=eq.${teamId}`
      }, 
      callback
    )
    .subscribe()
}

// Subscribe to task changes for a specific user
export function subscribeToUserTaskChanges(userId, callback) {
  return supabase
    .channel('user-task-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
} 