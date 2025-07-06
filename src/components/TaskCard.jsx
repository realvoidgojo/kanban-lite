import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateTask, deleteTask } from '../services/taskService'

const TaskCard = ({ task, isDragging = false, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [showMenu, setShowMenu] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    disabled: isEditing,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = async () => {
    try {
      const updatedTask = await updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })
      onUpdate(updatedTask)
      setIsEditing(false)
    } catch (error) {
      // Task update failed - could show user notification here
    }
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task.id)
        onDelete(task.id)
      } catch (error) {
        // Task deletion failed - could show user notification here
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      current: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    return colors[status] || colors.new
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleDeleteClick = () => {
    handleDelete()
    setShowMenu(false)
  }

  if (isDragging) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-90 rotate-2 transform">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {task.description}
          </p>
        )}
      </div>
    )
  }

  const renderEditForm = () => (
    <div className="space-y-4 pr-20">
      <input
        type="text"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        placeholder="Task title..."
        autoFocus
      />
      <textarea
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        placeholder="Description (optional)..."
      />
      <div className="flex space-x-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )

  const renderTaskContent = () => (
    <div className="pr-20">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 leading-relaxed">
        {task.title}
      </h4>
      
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(task.created_at)}
        </span>
      </div>
    </div>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer ${
        isSortableDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {!isEditing && (
        <div className="absolute top-3 right-3 flex items-center space-x-1">
          <button
            {...listeners}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150 cursor-grab active:cursor-grabbing"
            title="Drag to move task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-150"
            title="Task options"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      )}
      
      {showMenu && (
        <div className="absolute top-12 right-3 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
          <button
            onClick={handleEditClick}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Task
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Task
          </button>
        </div>
      )}

      {isEditing ? renderEditForm() : renderTaskContent()}
    </div>
  )
}

export default TaskCard 