import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginTeam, isAuthenticated } from '../services/authService'
import { useAuth } from '../store/AuthContext'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    teamName: '',
    teamPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { refreshAuth } = useAuth()

  // Check if already authenticated on component mount
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!formData.teamName || !formData.teamPassword) {
        throw new Error('Team name and password are required')
      }

      await loginTeam(formData.teamName, formData.teamPassword)
      
      // Force authentication state update
      refreshAuth()
      
      // Clear form after successful login
      setFormData({
        teamName: '',
        teamPassword: '',
      })
      
      // Verify authentication before navigation
      const authCheck = setInterval(() => {
        if (isAuthenticated()) {
          clearInterval(authCheck)
          navigate('/dashboard')
        }
      }, 50)
      
      // Timeout after 2 seconds
      setTimeout(() => {
        clearInterval(authCheck)
        if (!isAuthenticated()) {
          setError('Login failed. Please try again.')
          setIsLoading(false)
        }
      }, 2000)
      
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const renderFormInput = (id, name, type, placeholder) => (
    <div>
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input
        id={id}
        name={name}
        type={type}
        required
        className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
          id === 'teamName' ? 'rounded-t-md' : 'rounded-b-md'
        } focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
        placeholder={placeholder}
        value={formData[name]}
        onChange={handleChange}
        disabled={isLoading}
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your team
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your team credentials to access the dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            {renderFormInput('teamName', 'teamName', 'text', 'Team Name')}
            {renderFormInput('teamPassword', 'teamPassword', 'password', 'Team Password')}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have a team yet?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Create new team
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage 