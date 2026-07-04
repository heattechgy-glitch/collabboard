import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    checkUser()
    fetchBoards()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login')
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('boards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boards',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBoards(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setBoards(prev => prev.filter(b => b.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setBoards(prev => prev.map(b => b.id === payload.new.id ? payload.new : b))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login')
      return
    }
    setUser(session.user)
  }

  async function fetchBoards() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: ownedBoards, error: ownedError } = await supabase
        .from('boards')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })

      if (ownedError) throw ownedError

      const { data: sharedAccess, error: sharedError } = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', session.user.id)

      if (sharedError) throw sharedError

      let sharedBoards = []
      if (sharedAccess && sharedAccess.length > 0) {
        const sharedIds = sharedAccess.map(s => s.board_id)
        const { data: shared, error: fetchSharedError } = await supabase
          .from('boards')
          .select('*')
          .in('id', sharedIds)
          .order('created_at', { ascending: false })

        if (fetchSharedError) throw fetchSharedError
        sharedBoards = shared || []
      }

      const allBoards = [...(ownedBoards || []), ...sharedBoards]
      const uniqueBoards = allBoards.filter((board, index, self) =>
        index === self.findIndex(b => b.id === board.id)
      )

      setBoards(uniqueBoards)
    } catch (error) {
      console.error('Error fetching boards:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createBoard(e) {
    e.preventDefault()
    if (!newBoardName.trim()) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert({
          name: newBoardName.trim(),
          description: newBoardDescription.trim() || null,
          owner_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      const defaultColumns = [
        { name: 'To Do', position: 0, board_id: data.id },
        { name: 'In Progress', position: 1, board_id: data.id },
        { name: 'Done', position: 2, board_id: data.id }
      ]

      await supabase.from('columns').insert(defaultColumns)

      setNewBoardName('')
      setNewBoardDescription('')
      setShowCreateModal(false)
      navigate(`/board/${data.id}`)
    } catch (error) {
      console.error('Error creating board:', error)
      alert('Failed to create board. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function deleteBoard(boardId) {
    try {
      const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .in('column_id', 
          supabase.from('columns').select('id').eq('board_id', boardId)
        )

      const { error: columnsError } = await supabase
        .from('columns')
        .delete()
        .eq('board_id', boardId)

      const { error: membersError } = await supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)

      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId)

      if (error) throw error

      setBoards(prev => prev.filter(b => b.id !== boardId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting board:', error)
      alert('Failed to delete board. Please try again.')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg">Loading your boards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3b82f6] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">CollabBoard</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm truncate max-w-[150px]">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">My Boards</h2>
            <p className="text-slate-400 mt-1">
              {boards.length} {boards.length === 1 ? 'board' : 'boards'} total
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3b82f6] hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Board
          </button>
        </div>

        {boards.length > 0 && (
          <div className="mb-6">
            <div className="relative">