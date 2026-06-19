import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/SupabaseAuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthPage } from './components/Auth/AuthPage'
import { Navigation } from './components/Navigation'
import { MoodSelector } from './components/MoodSelector'
import { StatusDisplay } from './components/StatusDisplay'
import { SupportNetwork } from './components/SupportNetwork'
import { Settings } from './components/pages/Settings'
import { Friends } from './components/pages/Friends'
import { Profile } from './components/pages/Profile'
import { History } from './components/pages/History'
import { Help } from './components/pages/Help'
import { useSupabaseMoods } from './hooks/useSupabaseMoods'
import { useSupabaseContacts } from './hooks/useSupabaseContacts'
import { useSocket } from './contexts/SocketContext'
import { type MoodId } from './lib/utils'

function AppContent() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'home'
  })
  const [isVisible, setIsVisible] = useState(true)
  
  const { user, profile } = useAuth()
  const { currentMood, createMood, acknowledgeMood, isLoading: moodLoading } = useSupabaseMoods()
  const { contacts, isLoading: contactsLoading } = useSupabaseContacts()
  const { emitMoodUpdate, emitMoodAcknowledgment, onlineUsers } = useSocket()

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage)
  }, [currentPage])

  const handleMoodSelect = async (moodId: MoodId) => {
    try {
      await createMood(moodId, isVisible)
      // Emit socket event for real-time updates
      emitMoodUpdate(moodId)
    } catch (error) {
      console.error('Failed to create mood:', error)
    }
  }

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  const handleAddContact = () => {
    // This will be handled in the Friends page
    console.log('Add contact functionality moved to Friends page')
  }

  const handleAcknowledge = async (contactId: number) => {
    try {
      await acknowledgeMood(contactId)
      // Find the contact to emit acknowledgment
      const contact = contacts.find(c => c.id === contactId)
      if (contact) {
        emitMoodAcknowledgment(contact.contact_user_id)
      }
    } catch (error) {
      console.error('Failed to acknowledge mood:', error)
    }
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="space-y-6">
            <MoodSelector 
              onMoodSelect={handleMoodSelect}
              currentMood={currentMood?.mood_type}
            />
            
            <StatusDisplay
              currentMood={currentMood?.mood_type}
              acknowledgeCount={currentMood?.acknowledgment_count || 0}
              lastUpdated={currentMood?.created_at ? new Date(currentMood.created_at) : undefined}
              isVisible={isVisible}
              onToggleVisibility={handleToggleVisibility}
            />
            
            <SupportNetwork
              contacts={contacts.map(c => ({
                id: c.id.toString(),
                name: c.contact_profile?.display_name || c.contact_profile?.username || 'Unknown',
                hasAcknowledged: false // TODO: Track acknowledgments per contact
              }))}
              networkMembers={contacts.map(c => ({
                id: c.id.toString(),
                name: c.contact_profile?.display_name || c.contact_profile?.username || 'Unknown',
                currentMood: c.current_mood?.mood_type,
                lastUpdated: c.current_mood?.created_at ? new Date(c.current_mood.created_at) : undefined,
                isOnline: onlineUsers.has(c.contact_user_id)
              }))}
              onAddContact={handleAddContact}
              onAcknowledge={handleAcknowledge}
            />
          </div>
        )
      case 'profile':
        return <Profile />
      case 'friends':
        return <Friends />
      case 'history':
        return <History />
      case 'settings':
        return <Settings />
      case 'help':
        return <Help />
      default:
        return <div>Page not found</div>
    }
  }

  return (
    <div className="min-h-screen paper-texture">
      <Navigation onPageChange={setCurrentPage} currentPage={currentPage} />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  )
}

function AppMain() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="handwritten text-gray-600">Loading sTEAtus...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthPage />
  }

  return (
    <SocketProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SocketProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppMain />
    </AuthProvider>
  )
}

export default App