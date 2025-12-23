import React from 'react'
import { menuItemsData } from '../assets/assets'
import { NavLink } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'

const MenuItems = ({setSidebarOpen}) => {
  const { notificationCounts, markAllAsRead } = useNotifications()

  const getNotificationCount = (label) => {
    switch(label) {
      case 'Home':
        return notificationCounts.feed;
      case 'Messages':
        return notificationCounts.messages;
      case 'Connections':
        return notificationCounts.connections;
      default:
        return 0;
    }
  }

  const handleTabClick = (label) => {
    setSidebarOpen(false);
    
    // Mark all notifications of this type as read when clicking the tab
    switch(label) {
      case 'Home':
        break;
      case 'Messages':
        break;
      case 'Connections':
        break;
      default:
        break;
    }
  }

  return (
    <div className='px-6 text-gray-300 space-y-1 font-medium'>
      {
        menuItemsData.map(({to, label, Icon})=>{
          const notificationCount = getNotificationCount(label);
          
          return (
            <NavLink 
              key={to} 
              to={to} 
              end={to === '/'} 
              onClick={() => handleTabClick(label)} 
              className={({isActive}) => `px-3.5 py-2 flex items-center gap-3 rounded-xl ${isActive ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'} relative group`}
            >
              <Icon className="w-5 h-5"/>
              {label}
              
              {/* Notification Badge */}
              {notificationCount > 0 && (
                <span className="absolute right-3 flex items-center justify-center">
                  <span className="relative flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-xs text-white font-bold">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  </span>
                </span>
              )}
            </NavLink>
          )
        })
      }
    </div>
  )
}

export default MenuItems