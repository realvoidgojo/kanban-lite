import { useState, useEffect, useRef } from 'react'
import { searchTasks, createTask } from '../services/taskService'
import { getUserByName } from '../services/teamService'
import { parseAndValidateCommand, isCommand, getCommandSuggestions, getHelpText } from '../utils/commandParser'

const GlobalSearch = ({ teamMembers, selectedUser, onUserSelect }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    
    if (value.trim() === '') {
      setResults([])
      setSuggestions([])
      setShowDropdown(false)
      setShowHelp(false)
      return
    }

    if (isCommand(value)) {
      const commandSuggestions = getCommandSuggestions(value, teamMembers)
      setSuggestions(commandSuggestions)
      if (commandSuggestions.length > 0) {
        updateDropdownPosition()
        setShowDropdown(true)
      }
      setResults([])
      setShowHelp(false)
    } else {
      handleSearch(value)
      setSuggestions([])
      setShowHelp(false)
    }
  }

  const handleSearch = async (searchQuery) => {
    try {
      setLoading(true)
      setError('')
      const searchResults = await searchTasks(searchQuery)
      setResults(searchResults)
      if (searchResults.length > 0) {
        updateDropdownPosition()
        setShowDropdown(true)
      }
    } catch (error) {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (query.trim() === '') return

      const parsed = parseAndValidateCommand(query)
      
      if (parsed.type === 'help') {
        setShowHelp(true)
        updateDropdownPosition()
        setShowDropdown(true)
        setResults([])
        setSuggestions([])
        return
      }

      if (parsed.type === 'add' && parsed.isValid) {
        try {
          setLoading(true)
          setError('')
          
          let targetUserId = null
          
          if (parsed.username) {
            const targetUser = await getUserByName(parsed.username)
            if (!targetUser) {
              setError(`User @${parsed.username} not found`)
              return
            }
            targetUserId = targetUser.id
          }
          
          await createTask(parsed.title, '', targetUserId)
          
          setQuery('')
          setResults([])
          setShowDropdown(false)
          setError('')
          
        } catch (error) {
          setError(error.message)
        } finally {
          setLoading(false)
        }
      } else if (parsed.type === 'search') {
        handleSearch(parsed.query)
      } else if (!parsed.isValid) {
        setError(parsed.error)
      }
    } else if (e.key === 'Escape') {
      setQuery('')
      setResults([])
      setSuggestions([])
      setShowDropdown(false)
      setShowHelp(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    inputRef.current?.focus()
    setSuggestions([])
    setShowDropdown(false)
  }

  const handleSearchResultClick = (task) => {
    if (task.users && onUserSelect) {
      const teamMember = teamMembers.find(member => member.name === task.users.name)
      if (teamMember) {
        onUserSelect(teamMember)
        setQuery('')
        setResults([])
        setShowDropdown(false)
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        setShowHelp(false)
      }
    }

    const handleWindowEvents = () => {
      if (showDropdown) {
        updateDropdownPosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleWindowEvents)
    window.addEventListener('scroll', handleWindowEvents)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleWindowEvents)
      window.removeEventListener('scroll', handleWindowEvents)
    }
  }, [showDropdown])

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) {
              updateDropdownPosition()
              setShowDropdown(true)
            }
          }}
          placeholder="Search tasks or use commands like :add @user - task"
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg z-[9999]">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {showDropdown && (
        <div 
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999] max-h-80 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top + 4}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {showHelp && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {getHelpText()}
              </pre>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 mb-2">
                Command Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <code className="text-blue-600 dark:text-blue-400">{suggestion}</code>
                </button>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 mb-2">
                Search Results ({results.length})
              </div>
              {results.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleSearchResultClick(task)}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                  title={`Click to view ${task.users?.name}'s board`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {task.users?.name} • {task.status.replace('_', ' ')}
                        <span className="ml-1 text-blue-600 dark:text-blue-400">→ Switch to board</span>
                      </p>
                    </div>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      task.status === 'current' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !showHelp && suggestions.length === 0 && results.length === 0 && query.trim() && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try using commands like <code>:add @user - task</code> or <code>:help</code></p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch 