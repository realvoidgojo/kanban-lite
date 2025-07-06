import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { getTasksGroupedByStatus, updateTaskStatus, createTask } from '../services/taskService'
import TaskCard from './TaskCard'
import TaskColumn from './TaskColumn'

const KanbanBoard = ({ userId }) => {
  const [tasks, setTasks] = useState({
    new: [],
    current: [],
    in_progress: [],
    completed: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const columns = [
    { id: 'new', title: 'New Task' },
    { id: 'current', title: 'Current Task' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'completed', title: 'Completed' }
  ]

  useEffect(() => {
    loadTasks()
  }, [userId])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError('')
      const groupedTasks = await getTasksGroupedByStatus(userId)
      setTasks(groupedTasks)
    } catch (error) {
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    setActiveTask(findTaskById(active.id))
  }

  const handleDragOver = () => {
    // Visual feedback only - state updates handled in handleDragEnd
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    setActiveId(null)
    setActiveTask(null)
    
    if (!over || active.id === over.id) return
    
    const activeTask = findTaskById(active.id)
    const activeColumn = findColumnByTaskId(active.id)
    
    if (!activeTask || !activeColumn) return
    
    let targetColumn = null
    
    const overColumn = columns.find(col => col.id === over.id)
    if (overColumn) {
      targetColumn = overColumn.id
    } else {
      const overTask = findTaskById(over.id)
      if (overTask) {
        targetColumn = findColumnByTaskId(over.id)
      }
    }
    
    if (targetColumn && activeColumn !== targetColumn) {
      try {
        await updateTaskStatus(active.id, targetColumn)
        
        setTasks(prev => {
          const newTasks = { ...prev }
          newTasks[activeColumn] = newTasks[activeColumn].filter(task => task.id !== active.id)
          newTasks[targetColumn] = [...newTasks[targetColumn], { ...activeTask, status: targetColumn }]
          return newTasks
        })
        
      } catch (error) {
        setError('Failed to update task status')
        loadTasks()
      }
    } else if (targetColumn && activeColumn === targetColumn) {
      const overTask = findTaskById(over.id)
      if (overTask) {
        setTasks(prev => {
          const newTasks = { ...prev }
          const oldIndex = newTasks[activeColumn].findIndex(task => task.id === active.id)
          const newIndex = newTasks[activeColumn].findIndex(task => task.id === over.id)
          newTasks[activeColumn] = arrayMove(newTasks[activeColumn], oldIndex, newIndex)
          return newTasks
        })
      }
    }
  }

  const findTaskById = (id) => {
    for (const columnTasks of Object.values(tasks)) {
      const task = columnTasks.find(task => task.id === id)
      if (task) return task
    }
    return null
  }

  const findColumnByTaskId = (taskId) => {
    for (const [columnId, columnTasks] of Object.entries(tasks)) {
      if (columnTasks.some(task => task.id === taskId)) {
        return columnId
      }
    }
    return null
  }

  const handleAddTask = async (taskData) => {
    try {
      const newTask = await createTask(taskData.title, taskData.description || '', userId, taskData.status)
      setTasks(prev => ({
        ...prev,
        [taskData.status]: [...prev[taskData.status], newTask]
      }))
    } catch (error) {
      setError('Failed to add task')
    }
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => {
      const newTasks = { ...prev }
      let taskFound = false
      
      Object.keys(newTasks).forEach(columnId => {
        const taskIndex = newTasks[columnId].findIndex(task => task.id === updatedTask.id)
        if (taskIndex !== -1) {
          if (updatedTask.status !== columnId) {
            newTasks[columnId].splice(taskIndex, 1)
            newTasks[updatedTask.status] = [...newTasks[updatedTask.status], updatedTask]
          } else {
            newTasks[columnId][taskIndex] = updatedTask
          }
          taskFound = true
        }
      })
      
      if (!taskFound && updatedTask.status && newTasks[updatedTask.status]) {
        newTasks[updatedTask.status] = [...newTasks[updatedTask.status], updatedTask]
      }
      
      return newTasks
    })
  }

  const handleTaskDelete = (taskId) => {
    setTasks(prev => {
      const newTasks = { ...prev }
      Object.keys(newTasks).forEach(columnId => {
        newTasks[columnId] = newTasks[columnId].filter(task => task.id !== taskId)
      })
      return newTasks
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full w-full p-6 relative z-0">
      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900 p-4">
          <div className="text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full relative z-0">
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={tasks[column.id] || []}
              onTaskAdd={handleAddTask}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
            />
          ))}
        </div>
        
        <DragOverlay style={{ zIndex: 1000 }}>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isDragging={true}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

export default KanbanBoard 