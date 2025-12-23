import React from 'react'
import { MapPin, MessageCircle, Plus, UserPlus, Check, GraduationCap } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { fetchUser } from '../features/user/userSlice'
import { fetchConnections } from '../features/connections/connectionsSlice'

const UserCard = ({ user }) => {
    const currentUser = useSelector((state) => state.user.value)
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleFollow = async () => {
        try {
            const { data } = await api.post('/api/user/follow', {id: user._id}, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
                dispatch(fetchUser())
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleConnectionRequest = async () => {
        if(currentUser.connections.includes(user._id)){
            return navigate('/messages/' + user._id)
        }

        try {
            const { data } = await api.post('/api/user/connect', {id: user._id}, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
    
                const token = await getToken()
                dispatch(fetchConnections(token))
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const isConnected = currentUser?.connections.includes(user._id)
    const isFollowing = currentUser?.following.includes(user._id)

    return (
        <div key={user._id} className='p-4 pt-6 flex flex-col justify-between w-72 shadow border border-gray-200 rounded-md relative'>
            <div className='text-center'>
                <img src={user.profile_picture} alt="" className='rounded-full w-16 shadow-md mx-auto'/>
                <p className='mt-4 font-semibold'>{user.full_name}</p>
                {user.username && <p className='text-gray-500 font-light'>@{user.username}</p>}
                {user.bio && <p className='text-gray-600 mt-2 text-center text-sm px-4 line-clamp-2'>{user.bio}</p>}
            </div>

            <div className='flex items-center justify-center gap-2 mt-4 text-xs text-gray-600'>
                {user.faculty && (
                    <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
                        <GraduationCap className='w-4 h-4'/> {user.faculty}
                    </div>
                )}
                {user.location && (
                    <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
                        <MapPin className='w-4 h-4'/> {user.location}
                    </div>
                )}
                <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1'>
                    <span>{user.followers?.length || 0}</span> Followers
                </div>
            </div>

            <div className='flex mt-4 gap-2'>
                {/* Follow Button */}
                <button 
                    onClick={handleFollow} 
                    disabled={isFollowing}
                    className={`w-full py-2 rounded-md flex justify-center items-center gap-2 ${
                        isFollowing 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white cursor-pointer'
                    }`}
                >
                    {isFollowing ? <Check className='w-4 h-4'/> : <UserPlus className='w-4 h-4'/>}
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
                
                {/* Connection/Messaging Button */}
                <button 
                    onClick={handleConnectionRequest}
                    className={`flex items-center justify-center w-16 border rounded-md group active:scale-95 transition cursor-pointer ${
                        isConnected 
                            ? 'border-green-500 text-green-500 hover:bg-green-50' 
                            : 'border-slate-500 text-slate-500 hover:bg-slate-50'
                    }`}
                    title={isConnected ? 'Send Message' : 'Connect'}
                >
                    {isConnected ? (
                        <MessageCircle className='w-5 h-5 group-hover:scale-105 transition'/>
                    ) : (
                        <Plus className='w-5 h-5 group-hover:scale-105 transition'/>
                    )}
                </button>
            </div>

            {/* Connection Status Badge */}
            {isConnected && (
                <div className="absolute top-2 right-2">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Connected
                    </span>
                </div>
            )}
        </div>
    )
}

export default UserCard