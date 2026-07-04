import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableCard({ card, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-slate-700 p-3 rounded-lg shadow-md cursor-grab active:cursor-grabbing hover:bg-slate-600 transition-colors group"
    >
      <div className="flex justify-between items-start">
        <h4 className="text-white font-medium text-sm">{card.title}</h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(card)
            }}
            className="text-slate-400 hover:text-[#0ea5e9] p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(card.id)
            }}
            className="text-slate-400 hover:text-red-500 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {card.description && (
        <p className="text-slate-400 text-xs mt-2 line-clamp-2">{card.description}</p>
      )}
    </div>
  )
}

function CardOverlay({ card }) {
  return (
    <div className="bg-slate-700 p-3 rounded-lg shadow-xl border-2 border-[#0ea5e9]">
      <h4 className="text-white font-medium text-sm">{card.title}</h4>
      {card.description && (
        <p className="text-slate-400 text-xs mt-2 line-clamp-2">{card.description}</p>
      )}
    </div>
  )
}

function DroppableColumn({ column, cards, onAddCard, onEditCard, onDeleteCard, onEditColumn, onDeleteColumn }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim())
      setNewCardTitle('')
      setIsAddingCard(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-800 rounded-xl p-4 min-w-[280px] max-w-[280px] flex flex-col max-h-[calc(100vh-200px)] transition-colors ${
        isOver ? 'ring-2 ring-[#0ea5e9]' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold text-lg">{column.title}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onEditColumn(column)}
            className="text-slate-400 hover:text-[#0ea5e9] p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDeleteColumn(column.id)}
            className="text-slate-400 hover:text-red-500 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[100px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </SortableContext>
      </div>

      {isAddingCard ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Card title..."
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCard()
              if (e.key === 'Escape') {
                setIsAddingCard(false)
                setNewCardTitle('')
              }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="flex-1 bg-[#0ea5e9] hover:bg-sky-600 text-white py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingCard(false)
                setNewCardTitle('')
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingCard(true)}
          className="mt-3 w-full py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Card
        </button>
      )}
    </div>
  )
}

export default function BoardView() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  
  const [board, setBoard] = useState(null)
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCard, setActiveCard] = useState(null)
  
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  
  const [editingCard, setEditingCard] = useState(null)
  const [editingColumn, setEditingColumn] = useState(null)
  const [editCardTitle, setEditCardTitle] = useState('')
  const [editCardDescription, setEditCardDescription] = useState('')
  const [editColumnTitle, setEditColumnTitle] = useState('')

  const columnsChannelRef = useRef(null)
  const cardsChannelRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchBoardData = useCallback(async () => {
    try {
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single()

      if (boardError) throw boardError
      setBoard(boardData)

      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position')

      if (columnsError) throw columnsError
      setColumns(columnsData || [])

      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('board_id', boardId)
        .order('position')

      if (cardsError) throw cardsError
      setCards(cardsData || [])

      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [boardId])

  useEffect(() => {
    fetchBoardData()

    columnsChannelRef.current = supabase
      .channel(`columns:board_id=eq.${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setColumns((prev) => [...prev, payload.new].sort((a, b) => a.position - b.position))
          } else if (payload.eventType === 'UPDATE') {
            setColumns((prev) =>
              prev.map((col) => (col.id === payload.new.id ? payload.new : col)).sort((a, b) => a.position - b.position)
            )
          } else if (payload.eventType === 'DELETE') {
            setColumns((prev) => prev.filter((col) => col.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    cardsChannelRef.current = supabase
      .channel(`cards:board_id=eq.${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCards((prev) => [...prev, payload.new].sort((a, b) => a.position - b.position))
          } else if (payload.eventType === 'UPDATE') {
            setCards((prev) =>
              prev.map((card) => (card.id === payload.new.id ? payload.new : card)).sort((a, b) => a.position - b.position)
            )
          } else if (payload.eventType === 'DELETE') {
            setCards((prev) => prev.filter((card) => card.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      if (columnsChannelRef.current) {
        supabase.removeChannel(columnsChannelRef.current)
      }
      if (cardsChannelRef.current) {
        supabase.removeChannel(cardsChannelRef.current)
      }
    }
  }, [boardId, fetchBoardData])

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return
    
    try {
      const maxPosition = columns.length > 0 ? Math.max(...columns.map(c => c.position)) : -1
      
      const { error } = await supabase
        .from('columns')
        .insert({
          board_id: boardId,
          title: newColumnTitle.trim(),
          position: maxPosition + 1,
        })
      
      if (error) throw error
      
      setNewColumnTitle('')
      setIsAddingColumn(false)
    } catch (err) {
      console.error('Error adding column:', err)
      alert('Failed to add column')
    }
  }

  const handleAddCard = async (columnId, title) => {
    try {
      const columnCards = cards.filter(c => c.column_id === columnId)
      const maxPosition = columnCards.length > 0 ? Math.max