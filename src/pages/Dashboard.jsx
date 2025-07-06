import { useState, useEffect } from 'react'
import { useAuth } from '../store/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getCurrentTeamMembers, switchToMember } from '../services/teamService'
import Sidebar from '../components/Sidebar'
import KanbanBoard from '../components/KanbanBoard'
import GlobalSearch from '../components/GlobalSearch'
import AddMemberModal from '../components/AddMemberModal'

const Dashboard = () => {
  const { user, team, signOut } = useAuth()
  const navigate = useNavigate()
  const [teamMembers, setTeamMembers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      const members = await getCurrentTeamMembers()
      setTeamMembers(members)
    } catch (error) {
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleMemberAdded = (newMember) => {
    setShowAddMemberModal(false)
    loadTeamMembers()
    setSelectedUser(newMember)
  }

  const handleUserSelect = async (member) => {
    try {
      await switchToMember(member.name)
      setSelectedUser(member)
    } catch (error) {
      setError('Failed to switch to member')
    }
  }

  const handleMemberRemoved = (removedMember) => {
    setTeamMembers(prev => prev.filter(member => member.id !== removedMember.id))
    if (selectedUser?.id === removedMember.id) {
      setSelectedUser(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const renderEmptyState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mx-auto h-20 w-20 text-gray-300 dark:text-gray-600 mb-6">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 20h8v-2a3 3 0 00-5.196-2.121m0 0a5.002 5.002 0 019.75-2.51M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to {team?.name}!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
          Ready to boost your team's productivity? Start by adding your first team member. 
          Each member will have their own personalized Kanban board for seamless task management.
        </p>
        <button
          onClick={() => setShowAddMemberModal(true)}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Your First Member
        </button>
      </div>
    </div>
  )

  const renderSelectMemberState = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mx-auto h-20 w-20 text-gray-300 dark:text-gray-600 mb-6">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Select a Team Member
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
          Choose a team member from the sidebar to view and manage their Kanban board.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          👈 Click on any member in the sidebar to get started
        </div>
      </div>
    </div>
  )

  const renderUserBoard = () => (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedUser.name}'s Board
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Personal task management workspace
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Member since {new Date(selectedUser.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard userId={selectedUser.id} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full transition-colors duration-200">
      <header className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 w-full backdrop-blur-sm z-50">
        <div className="w-full px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {team?.name || 'Team Workspace'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} · Kanban Board
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {teamMembers.length > 0 && (
              <div className="flex-1 max-w-2xl mx-12">
                <GlobalSearch 
                  teamMembers={teamMembers} 
                  selectedUser={selectedUser} 
                  onUserSelect={handleUserSelect}
                />
              </div>
            )}
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                  {team?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex w-full h-[calc(100vh-5rem)] relative z-10">
        <Sidebar
          teamMembers={teamMembers}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          onAddMember={() => setShowAddMemberModal(true)}
          onMemberRemoved={handleMemberRemoved}
        />

        <main className="flex-1 w-full overflow-hidden bg-gray-50 dark:bg-gray-900 relative z-0">
          {error && (
            <div className="m-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </div>
              </div>
            </div>
          )}
          
          {teamMembers.length === 0 ? renderEmptyState() : selectedUser ? renderUserBoard() : renderSelectMemberState()}
        </main>
      </div>

      {showAddMemberModal && (
        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onMemberAdded={handleMemberAdded}
        />
      )}
    </div>
  )
}

export default Dashboard 