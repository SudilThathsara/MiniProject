import React, { useEffect, useState } from 'react'
import { Search, MessageCircle, UserPlus } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConnections } from '../features/connections/connectionsSlice'

const Discover = () => {
  const dispatch = useDispatch()
  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { getToken, user: currentUser } = useAuth()
  const { connections } = useSelector((state) => state.connections)

  const handleSearch = async (e) => {
    if(e.key === 'Enter'){
      try {
        setUsers([])
        setLoading(true)
        const { data } = await api.post('/api/user/discover', {input}, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        })
        data.success ? setUsers(data.users) : toast.error(data.message)
        setLoading(false)
        setInput('')
      } catch (error) {
        toast.error(error.message)
      }
      setLoading(false)
    }
  }

  // Send connection request to start messaging
  const handleSendConnectionRequest = async (userId) => {
    try {
      const { data } = await api.post('/api/user/connect', {id: userId}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      
      if (data.success) {
        toast.success(data.message)
        
        const token = await getToken()
        dispatch(fetchConnections(token))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Check if user is already connected
  const isUserConnected = (userId) => {
    return connections.some(connection => connection._id === userId)
  }

  // Check if connection request is pending
  const isConnectionPending = async (userId) => {
    
    return false
  }

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchConnections(token))
    })
  }, [dispatch])

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>

        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Discover People</h1>
          <p className='text-slate-600'>Connect with amazing people and grow your network</p>
        </div>

        {/* Search */}
        <div className='mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80'>
          <div className='p-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
              <input 
                type="text" 
                placeholder='Search people by name, username, bio, or location...' 
                className='pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm' 
                onChange={(e)=>setInput(e.target.value)} 
                value={input} 
                onKeyUp={handleSearch}
              />
            </div>
          </div>
        </div>

        <div className='flex flex-wrap gap-6'>
          {users.map((user) => (
            <div key={user._id} className='relative'>
              <UserCard user={user} />
              
              {/* Connection/Messaging Actions */}
              <div className='absolute top-4 right-4 flex flex-col gap-2'>
                {user._id !== currentUser._id && (
                  <>
                    {isUserConnected(user._id) ? (
                      <button
                        onClick={() => window.location.href = `/messages/${user._id}`}
                        className='bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110'
                        title="Send Message"
                      >
                        <MessageCircle className='w-4 h-4' />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendConnectionRequest(user._id)}
                        className='bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110'
                        title="Send Connection Request"
                      >
                        <UserPlus className='w-4 h-4' />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {
          loading && (<Loading height='60vh'/>)
        }

      </div>
    </div>
  )
}

export default Discover