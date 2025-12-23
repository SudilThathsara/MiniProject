import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

const initialState = {
  value: null
}

export const fetchUser = createAsyncThunk('user/fetchUser', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/auth/me')
    if (data.success) {
      return data.user
    } else {
      return rejectWithValue(data.message)
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch user')
  }
})

export const updateUser = createAsyncThunk('user/update', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/api/user/update', userData)
    if (data.success) {
      toast.success(data.message)
      return data.user
    } else {
      return rejectWithValue(data.message)
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update user')
  }
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.value = action.payload
    },
    clearUser: (state) => {
      state.value = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.value = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        toast.error(action.payload)
        state.value = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.value = action.payload
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        toast.error(action.payload)
      })
  }
})

export const { setUser, clearUser } = userSlice.actions
export default userSlice.reducer