import React, { useState } from 'react'
import { Image, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSelector } from "react-redux";
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  
  
  const [postType, setPostType] = useState('regular') 
  const [itemDetails, setItemDetails] = useState({
    itemType: 'lost', 
    fullName: '',
    address: '',
    mobileNumber: '',
    itemName: '',
    description: ''
  })

  const user = useSelector((state)=>state.user.value)
  const { getToken } = useAuth()
  
  const handleItemDetailChange = (field, value) => {
    setItemDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    if(!images.length && !content && postType === 'regular'){
      return toast.error('Please add at least one image or text')
    }

    if(postType === 'item' && (!itemDetails.itemName || !itemDetails.description || !itemDetails.fullName || !itemDetails.mobileNumber)){
      return toast.error('Please fill all required item details')
    }

    setLoading(true)

    const postTypeValue = images.length && content ? 'text_with_image' : images.length ? 'image' : 'text'

    try {
      const formData = new FormData();
      formData.append('content', content)
      formData.append('post_type', postTypeValue)
      formData.append('is_item_post', postType === 'item')
      
      if(postType === 'item') {
        formData.append('item_type', itemDetails.itemType)
        formData.append('full_name', itemDetails.fullName)
        formData.append('address', itemDetails.address)
        formData.append('mobile_number', itemDetails.mobileNumber)
        formData.append('item_name', itemDetails.itemName)
        formData.append('item_description', itemDetails.description)
      }
      
      images.map((image) =>{
        formData.append('images', image)
      })

      const { data } = await api.post('/api/post/add', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        toast.success(postType === 'item' ? 'Item posted successfully!' : 'Post created successfully!')
        navigate('/')
        // Reset form
        if(postType === 'item') {
          setItemDetails({
            itemType: 'lost',
            fullName: '',
            address: '',
            mobileNumber: '',
            itemName: '',
            description: ''
          })
        }
        setContent('')
        setImages([])
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.log(error.message)
      throw new Error(error.message)
    }
    setLoading(false)
  }

  return (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6 min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-6xl mx-auto p-6'>
         {/* Title */}
         <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Create Post</h1>
          <p className='text-slate-600'>Share your thoughts or report lost/found items</p>
         </div>

         {/* Form */}
         <div className='max-w-2xl bg-white p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4'>
            {/* Header */}
            <div className='flex items-center gap-3'>
              <img src={user.profile_picture} alt="" className='w-12 h-12 rounded-full shadow'/>
              <div>
                <h2 className='font-semibold'>{user.full_name}</h2>
                <p className='text-sm text-gray-500'>@{user.username}</p>
              </div>
            </div>

            {/* Post Type Selection */}
            <div className='flex gap-4 mb-4'>
              <button
                onClick={() => setPostType('regular')}
                className={`px-4 py-2 rounded-lg transition ${
                  postType === 'regular' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Regular Post
              </button>
              <button
                onClick={() => setPostType('item')}
                className={`px-4 py-2 rounded-lg transition ${
                  postType === 'item' 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Lost/Found Item
              </button>
            </div>

            {/* Lost/Found Item Form */}
            {postType === 'item' && (
              <div className='space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50'>
                <h3 className='font-semibold text-gray-800'>Item Details</h3>
                
                {/* Item Type */}
                <div className='flex gap-4'>
                  <label className='flex items-center gap-2'>
                    <input
                      type="radio"
                      value="lost"
                      checked={itemDetails.itemType === 'lost'}
                      onChange={(e) => handleItemDetailChange('itemType', e.target.value)}
                      className='text-indigo-500'
                    />
                    Lost Item
                  </label>
                  <label className='flex items-center gap-2'>
                    <input
                      type="radio"
                      value="found"
                      checked={itemDetails.itemType === 'found'}
                      onChange={(e) => handleItemDetailChange('itemType', e.target.value)}
                      className='text-indigo-500'
                    />
                    Found Item
                  </label>
                </div>

                {/* Full Name */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={itemDetails.fullName}
                    onChange={(e) => handleItemDetailChange('fullName', e.target.value)}
                    className='w-full p-2 border border-gray-300 rounded-lg'
                    placeholder='Enter your full name'
                    required
                  />
                </div>

                {/* Address */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Address
                  </label>
                  <input
                    type="text"
                    value={itemDetails.address}
                    onChange={(e) => handleItemDetailChange('address', e.target.value)}
                    className='w-full p-2 border border-gray-300 rounded-lg'
                    placeholder='Enter your address'
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={itemDetails.mobileNumber}
                    onChange={(e) => handleItemDetailChange('mobileNumber', e.target.value)}
                    className='w-full p-2 border border-gray-300 rounded-lg'
                    placeholder='Enter your mobile number'
                    required
                  />
                </div>

                {/* Item Name */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    What is the item? *
                  </label>
                  <input
                    type="text"
                    value={itemDetails.itemName}
                    onChange={(e) => handleItemDetailChange('itemName', e.target.value)}
                    className='w-full p-2 border border-gray-300 rounded-lg'
                    placeholder='e.g., iPhone 13, Wallet, Keys, etc.'
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Description *
                  </label>
                  <textarea
                    value={itemDetails.description}
                    onChange={(e) => handleItemDetailChange('description', e.target.value)}
                    className='w-full p-2 border border-gray-300 rounded-lg resize-none'
                    rows="3"
                    placeholder='Describe the item, where you lost/found it, distinctive features, etc.'
                    required
                  />
                </div>
              </div>
            )}

            {/* Regular Post Content */}
            {postType === 'regular' && (
              <textarea 
                className='w-full resize-none max-h-20 mt-4 text-sm outline-none placeholder-gray-400 border border-gray-300 rounded-lg p-3' 
                placeholder="What's happening?"
                onChange={(e)=>setContent(e.target.value)} 
                value={content}
                rows="4"
              />
            )}

            {/* Images */}
            {
              images.length > 0 && (
                <div className='flex flex-wrap gap-2 mt-4'>
                  {images.map((image, i)=>(
                    <div key={i} className='relative group'>
                      <img src={URL.createObjectURL(image)} className='h-20 rounded-md' alt="" />
                      <div onClick={()=> setImages(images.filter((_, index)=> index !== i))} className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'>
                        <X className="w-6 h-6 text-white"/>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }

            {/* Bottom Bar */}
            <div className='flex items-center justify-between pt-3 border-t border-gray-300'>
              <label htmlFor="images" className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer'>
                <Image className='size-6'/>
                Add Images
              </label>

              <input 
                type="file" 
                id="images" 
                accept='image/*' 
                hidden 
                multiple 
                onChange={(e)=> {
                  if(e.target.files) {
                    setImages([...images, ...Array.from(e.target.files)])
                  }
                }}
              />

              <button 
                disabled={loading} 
                onClick={()=> toast.promise(
                  handleSubmit(), 
                  {
                    loading: postType === 'item' ? 'Publishing Item...' : 'Publishing Post...',
                    success: postType === 'item' ? 'Item Published Successfully!' : 'Post Published Successfully!',
                    error: 'Failed to publish',
                  }
                )} 
                className='text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-50'
              >
                {postType === 'item' ? 'Publish Item' : 'Publish Post'}
              </button>
            </div>
         </div>
      </div>
    </div>
  )
}

export default CreatePost