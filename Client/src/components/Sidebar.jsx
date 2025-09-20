import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/chatContext';

const Sidebar = () => {
  const { getUsers, users, SelectedUser, setSelectedUser, unseenMessages } = useContext(ChatContext)
  const { logout, onlineUsers } = useContext(AuthContext)
  const [input, setInput] = useState("")  // ✅ keep string state
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const navigate = useNavigate()

  const filteredUsers = input
    ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase()))
    : users

  useEffect(() => {
    getUsers()
  }, [onlineUsers])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [])

  return (
    <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${SelectedUser ? 'max-md:hidden' : ''}`}>
      {/* Header */}
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="logo" className='max-w-40' />
          <div ref={menuRef} className='relative py-2'>
            <button
              type='button'
              aria-haspopup='menu'
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((v) => !v)}
              className='p-2 -m-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400'
            >
              <img src={assets.menu_icon} alt="menu" className='max-h-5 pointer-events-none' />
            </button>
            <div className={`absolute top-full right-0 z-50 w-40 p-4 mt-2 rounded-md bg-[#282142] border border-gray-600 text-gray-100 shadow-lg ${isMenuOpen ? 'block' : 'hidden'}`} role='menu'>
              <p
                onClick={() => { setIsMenuOpen(false); navigate('/profile') }}
                className='cursor-pointer text-sm hover:text-white'
                role='menuitem'
                tabIndex={0}
              >
                Edit Profile
              </p>
              <hr className='my-2 border-gray-500' />
              <p
                onClick={() => { setIsMenuOpen(false); logout() }}
                className='cursor-pointer text-sm hover:text-white'
                role='menuitem'
                tabIndex={0}
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
          <img src={assets.search_icon} alt="search" className='w-3' />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
            placeholder='Search User'
          />
        </div>
      </div>

      {/* Users List */}
      <div className='flex flex-col'>
        {filteredUsers.map((user) => (
          <div
            onClick={() => setSelectedUser(user)}
            key={user._id} // ✅ better than index
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${SelectedUser?._id === user._id && 'bg-[#282142]/50'}`}
          >
            <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-[35px] aspect-[1/1] rounded-full' />
            <div className='flex flex-col leading-5'>
              <p>{user.fullName}</p>
              {
                onlineUsers.includes(user._id)
                  ? <span className='text-green-400 text-xs'>Online</span>
                  : <span className='text-neutral-400 text-xs'>Offline</span>
              }
            </div>
            { unseenMessages?.[user._id] > 0 && (
              <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
