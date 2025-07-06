import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import AddTaskForm from './AddTaskForm'

const TaskColumn = ({ column, tasks, onTaskAdd, onTaskUpdate, onTaskDelete }) => {
  const [isAddingTask, setIsAddingTask] = useState(false)
  
  const { setNodeRef, isOver } = useDroppable({
    id: column.id
  })

  const getColumnColor = (status) => {
    const colors = {
      new: 'border-gray-300 dark:border-gray-600',
      current: 'border-yellow-300 dark:border-yellow-600',
      in_progress: 'border-blue-300 dark:border-blue-600',
      completed: 'border-green-300 dark:border-green-600'
    }
    return colors[status] || colors.new
  }

  const getColumnHeaderColor = (status) => {
    const colors = {
      new: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      current: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      in_progress: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      completed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    }
    return colors[status] || colors.new
  }

  const getColumnAccentColor = (status) => {
    const colors = {
      new: 'bg-gray-500',
      current: 'bg-yellow-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500'
    }
    return colors[status] || colors.new
  }

  const getTaskCountColor = (status) => {
    const colors = {
      new: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
      current: 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
      in_progress: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-100',
      completed: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100'
    }
    return colors[status] || colors.new
  }

  const handleTaskSave = (taskData) => {
    onTaskAdd({ ...taskData, status: column.id })
    setIsAddingTask(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={`group relative rounded-2xl border-2 transition-all duration-300 z-0 ${getColumnColor(column.id)} ${
        isOver ? 'border-opacity-100 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' : 'bg-white dark:bg-gray-800 border-opacity-30 hover:border-opacity-50'
      }`}
    >
      <div className={`relative px-6 py-4 rounded-t-2xl ${getColumnHeaderColor(column.id)}`}>
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${getColumnAccentColor(column.id)}`} />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold tracking-tight">
              {column.title}
            </h3>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getTaskCountColor(column.id)}`}>
              {tasks.length}
            </span>
          </div>
          
          <button
            onClick={() => setIsAddingTask(true)}
            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors group-hover:opacity-100 opacity-60"
            title="Add new task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {isAddingTask && (
            <div className="mb-4">
              <AddTaskForm
                onSave={handleTaskSave}
                onCancel={() => setIsAddingTask(false)}
              />
            </div>
          )}
          
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
          </div>
          
          {tasks.length === 0 && !isAddingTask && (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No tasks yet
              </p>
              <button
                onClick={() => setIsAddingTask(true)}
                className="inline-flex items-center px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add first task
              </button>
            </div>
          )}
        </SortableContext>
        
        {isOver && (
          <div className="absolute inset-4 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-blue-500 dark:text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Drop task here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskColumn 