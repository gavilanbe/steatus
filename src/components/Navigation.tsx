import React, { useState } from 'react'
import { Button } from './ui/button'
import { Drawer } from './ui/drawer'
import { Menu, X, Settings, User, Heart, Clock, HelpCircle, UserPlus } from 'lucide-react'

interface NavigationProps {
  onPageChange: (page: string) => void
  currentPage: string
}

export function Navigation({ onPageChange, currentPage }: NavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const menuItems = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'friends', label: 'Friends', icon: UserPlus },
    { id: 'history', label: 'Mood History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ]

  const handleMenuClick = (pageId: string) => {
    onPageChange(pageId)
    setIsDrawerOpen(false)
  }

  return (
    <>
      {/* Header with hamburger menu */}
      <div className="bg-white border-b-2 border-dashed border-gray-200 px-4 py-3 flex items-center justify-between sketchy-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDrawerOpen(true)}
          className="doodle-button text-gray-600 hover:color-soft-purple"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <h1 className="handwritten text-2xl color-soft-purple">sTEAtus</h1>
        
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <div className="bg-white h-full paper-texture">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-dashed border-gray-200">
            <h2 className="handwritten text-lg color-soft-purple">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDrawerOpen(false)}
              className="doodle-button text-gray-600 hover:color-soft-pink"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b-2 border-dashed border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-soft-purple rounded-full flex items-center justify-center float-animation">
                <span className="text-xl mood-emoji">😊</span>
              </div>
              <div>
                <h3 className="handwritten text-gray-700">You</h3>
                <p className="text-sm text-gray-500">Tea User</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const colors = ['color-soft-purple', 'color-soft-pink', 'color-soft-green', 'color-soft-blue', 'color-soft-yellow', 'color-soft-red']
              const bgColors = ['bg-soft-purple', 'bg-soft-pink', 'bg-soft-green', 'bg-soft-blue', 'bg-soft-yellow', 'bg-soft-red']
              const colorClass = colors[index % colors.length]
              const bgColorClass = bgColors[index % bgColors.length]
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 mb-1 doodle-button text-gray-600 hover:bg-gray-50",
                    currentPage === item.id && `${bgColorClass} ${colorClass} font-semibold`
                  )}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                  <span className="handwritten">{item.label}</span>
                </Button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-500 text-center handwritten">
              Made with 💝 for TEA community
            </p>
          </div>
        </div>
      </Drawer>
    </>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}