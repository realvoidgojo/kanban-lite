// Parse command input for smart task creation
// Supports format: ":add @user - task"
export function parseCommand(input) {
  const trimmedInput = input.trim()
  
  const addMatch = trimmedInput.match(/^:add\s+@(\w+)\s*-\s*(.+)$/i)
  
  if (addMatch) {
    return {
      type: 'add',
      username: addMatch[1],
      title: addMatch[2].trim(),
      isValid: true
    }
  }
  
  const simpleAddMatch = trimmedInput.match(/^:add\s+(.+)$/i)
  
  if (simpleAddMatch) {
    return {
      type: 'add',
      username: null,
      title: simpleAddMatch[1].trim(),
      isValid: true
    }
  }
  
  const searchMatch = trimmedInput.match(/^:search\s+(.+)$/i)
  
  if (searchMatch) {
    return {
      type: 'search',
      query: searchMatch[1].trim(),
      isValid: true
    }
  }
  
  if (trimmedInput.match(/^:help$/i)) {
    return {
      type: 'help',
      isValid: true
    }
  }
  
  if (trimmedInput.startsWith(':')) {
    return {
      type: 'unknown',
      isValid: false,
      error: 'Unknown command. Type :help for available commands.'
    }
  }
  
  return {
    type: 'search',
    query: trimmedInput,
    isValid: true
  }
}

// Get help text for available commands
export function getHelpText() {
  return `Available commands:
  
:add @username - task title
  Create a new task and assign it to a team member
  Example: :add @john - Fix the header bug

:add task title
  Create a new task for yourself
  Example: :add Update documentation

:search query
  Search for tasks containing the query
  Example: :search bug fix

:help
  Show this help message

You can also just type to search without using :search`
}

// Validate username format
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_]+$/.test(username)
}

// Validate task title
export function isValidTaskTitle(title) {
  return title && title.trim().length > 0 && title.trim().length <= 255
}

// Parse and validate command
export function parseAndValidateCommand(input) {
  const parsed = parseCommand(input)
  
  if (!parsed.isValid) {
    return parsed
  }
  
  // Additional validation for add commands
  if (parsed.type === 'add') {
    if (!isValidTaskTitle(parsed.title)) {
      return {
        ...parsed,
        isValid: false,
        error: 'Task title must be between 1 and 255 characters'
      }
    }
    
    if (parsed.username && !isValidUsername(parsed.username)) {
      return {
        ...parsed,
        isValid: false,
        error: 'Username can only contain letters, numbers, and underscores'
      }
    }
  }
  
  return parsed
}

// Format command for display
export function formatCommand(parsed) {
  switch (parsed.type) {
    case 'add':
      return parsed.username 
        ? `Add task "${parsed.title}" to @${parsed.username}`
        : `Add task "${parsed.title}" to yourself`
    case 'search':
      return `Search for "${parsed.query}"`
    case 'help':
      return 'Show help'
    case 'unknown':
      return 'Unknown command'
    default:
      return 'Unknown action'
  }
}

// Check if input is a command
export function isCommand(input) {
  return input.trim().startsWith(':')
}

// Get suggestions based on partial input
export function getCommandSuggestions(input, teamMembers = []) {
  const trimmed = input.trim().toLowerCase()
  
  if (trimmed === ':') {
    return [
      ':add @username - task title',
      ':add task title',
      ':search query',
      ':help'
    ]
  }
  
  if (trimmed.startsWith(':add @')) {
    const partial = trimmed.replace(':add @', '')
    const matchingMembers = teamMembers
      .filter(member => member.name.toLowerCase().startsWith(partial))
      .slice(0, 5)
    
    return matchingMembers.map(member => `:add @${member.name} - `)
  }
  
  if (trimmed.startsWith(':add') && !trimmed.includes('@')) {
    return [':add task title', ':add @username - task title']
  }
  
  if (trimmed.startsWith(':s')) {
    return [':search query']
  }
  
  if (trimmed.startsWith(':h')) {
    return [':help']
  }
  
  return []
} 