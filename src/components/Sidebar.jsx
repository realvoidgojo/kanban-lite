import { useState } from 'react'
import { removeTeamMember } from '../services/teamService'

const Sidebar = ({ teamMembers, selectedUser, onUserSelect, onAddMember, onMemberRemoved }) => {
  const [removingUserId, setRemovingUserId] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [userToRemove, setUserToRemove] = useState(null)

  const handleRemoveUser = (user, event) => {
    event.stopPropagation()
    setUserToRemove(user)
    setShowConfirmDialog(true)
  }

  const confirmRemoveUser = async () => {
    if (!userToRemove) return

    try {
      setRemovingUserId(userToRemove.id)
      await removeTeamMember(userToRemove.id)
      
      if (onMemberRemoved) {
        onMemberRemoved(userToRemove)
      }
      
      setShowConfirmDialog(false)
      setUserToRemove(null)
    } catch (error) {
      alert('Failed to remove user. Please try again.')
    } finally {
      setRemovingUserId(null)
    }
  }

  const cancelRemoveUser = () => {
    setShowConfirmDialog(false)
    setUserToRemove(null)
  }

  const renderMemberCard = (member) => (
    <div
      key={member.id}
      className={`group relative p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
        selectedUser?.id === member.id
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 shadow-sm'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
      }`}
      onClick={() => onUserSelect(member)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold mr-3 flex-shrink-0 ${
            selectedUser?.id === member.id ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''
          }`}>
            {member.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">
              {member.name}
            </div>
            <div className="text-xs opacity-75 truncate">
              Joined {new Date(member.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {selectedUser?.id === member.id && (
            <div className="p-1">
              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
          
          <button
            onClick={(e) => handleRemoveUser(member, e)}
            disabled={removingUserId === member.id}
            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            title={`Remove ${member.name}`}
          >
            {removingUserId === member.id ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 20h8v-2a3 3 0 00-5.196-2.121m0 0a5.002 5.002 0 019.75-2.51M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        No team members yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Click the button above to add your first team member
      </p>
    </div>
  )

  const renderConfirmDialog = () => (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center mb-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Remove Team Member
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Are you sure you want to remove <strong>{userToRemove?.name}</strong> from the team? 
            This will permanently delete their Kanban board and all associated tasks.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={cancelRemoveUser}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveUser}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex-shrink-0 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Team Members
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full font-medium">
              {teamMembers.length}
            </span>
          </div>
          
          <button
            onClick={() => {
              onAddMember();
            }}
            className="w-full flex items-center justify-center px-4 py-3 mb-6 border border-dashed border-blue-300 dark:border-blue-600 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {teamMembers.length === 0 ? 'Add First Member' : 'Add Member'}
          </button>
          
          {teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map(renderMemberCard)}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>
      </div>

      {showConfirmDialog && renderConfirmDialog()}
    </>
  )
}

export default Sidebar 