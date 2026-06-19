import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { UserPlus, Check, X, Search, Users, Clock } from 'lucide-react'
import { moods, type MoodId } from '@/lib/utils'
import { useSupabaseContacts } from '../../hooks/useSupabaseContacts'
import { useAuth } from '../../contexts/SupabaseAuthContext'
import { useFriends } from '../../hooks/useFriends'
import { useSocket } from '../../contexts/SocketContext'

export function Friends() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [friendCode, setFriendCode] = useState('')
  const [emailInvite, setEmailInvite] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const { user } = useAuth()
  const { 
    contacts, 
    friendRequests, 
    searchUsers, 
    searchResults,
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    addByFriendCode,
    isLoading 
  } = useSupabaseContacts()
  
  const {
    friends: friendsList,
    friendCode: myFriendCode,
    generateFriendCode,
    useFriendCode,
    sendEmailInvitation,
    isLoading: friendsLoading
  } = useFriends()
  
  const { onlineUsers } = useSocket()

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId)
    } catch (error) {
      console.error('Failed to accept friend request:', error)
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId)
    } catch (error) {
      console.error('Failed to decline friend request:', error)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchUsers(searchQuery.trim())
    }
  }

  const handleAddByCode = async () => {
    if (friendCode.trim()) {
      try {
        await useFriendCode(friendCode.trim())
        setFriendCode('')
        alert('Friend added successfully!')
      } catch (error) {
        console.error('Failed to add friend by code:', error)
        alert(error instanceof Error ? error.message : 'Failed to add friend. Please check the code and try again.')
      }
    }
  }

  const handleGenerateCode = async () => {
    try {
      await generateFriendCode()
      alert('New friend code generated!')
    } catch (error) {
      console.error('Failed to generate friend code:', error)
      alert('Failed to generate friend code. Please try again.')
    }
  }

  const handleSendEmailInvite = async () => {
    if (emailInvite.trim()) {
      try {
        await sendEmailInvitation(emailInvite.trim(), inviteMessage.trim() || undefined)
        setEmailInvite('')
        setInviteMessage('')
        alert('Invitation sent successfully!')
      } catch (error) {
        console.error('Failed to send email invitation:', error)
        alert('Failed to send invitation. Please try again.')
      }
    }
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Tab Navigation */}
      <Card className="doodle-card">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'friends' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('friends')}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-1" />
              Friends ({contacts.length})
            </Button>
            <Button
              variant={activeTab === 'requests' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('requests')}
              className="flex-1 relative"
            >
              <Clock className="w-4 h-4 mr-1" />
              Requests ({friendRequests.length})
              {friendRequests.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  {friendRequests.length}
                </div>
              )}
            </Button>
            <Button
              variant={activeTab === 'add' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('add')}
              className="flex-1"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <Card className="doodle-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-amber-800">Your Support Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading || friendsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full mx-auto mb-2"></div>
                <p className="text-amber-600">Loading friends...</p>
              </div>
            ) : (contacts.length === 0 && friendsList.length === 0) ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-amber-300 mb-2" />
                <p className="text-amber-700">No friends added yet</p>
                <p className="text-sm text-amber-600">Add friends to build your support network</p>
              </div>
            ) : (
              [...contacts, ...friendsList.filter(friend => !contacts.some(c => c.id === friend.id))].map((contact) => {
                const mood = contact.current_mood?.mood_type ? moods.find(m => m.id === contact.current_mood.mood_type) : null
                return (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {contact.contact_profile?.avatar_url ? (
                            <img 
                              src={contact.contact_profile.avatar_url} 
                              alt="Avatar" 
                              className="w-full h-full object-cover"
                            />
                          ) : mood ? (
                            <span className="text-lg">{mood.emoji}</span>
                          ) : (
                            <span className="text-gray-500">😊</span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                          onlineUsers.has(contact.id) ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">
                          {contact.contact_profile?.display_name || contact.contact_profile?.username || 'Unknown User'}
                        </h4>
                        <p className="text-xs text-amber-600">
                          {mood ? `Feeling ${mood.name.toLowerCase()}` : 'No status'}
                          {contact.current_mood?.created_at && (
                            <span className="ml-2">• {formatLastSeen(new Date(contact.current_mood.created_at))}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="text-amber-700">
                      View
                    </Button>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Friend Requests */}
      {activeTab === 'requests' && (
        <Card className="doodle-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-amber-800">Friend Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {friendRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-amber-300 mb-2" />
                <p className="text-amber-700">No pending requests</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900">
                        {request.requester_profile?.display_name || request.requester_profile?.username || 'Unknown User'}
                      </h4>
                      <p className="text-xs text-amber-600">{formatLastSeen(new Date(request.created_at))}</p>
                    </div>
                  </div>
                  
                  {request.message && (
                    <p className="text-sm text-amber-700 bg-white p-2 rounded border">
                      "{request.message}"
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id.toString())}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isLoading}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineRequest(request.id.toString())}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Friends */}
      {activeTab === 'add' && (
        <div className="space-y-4">
          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-amber-800">Find Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              <Button 
                className="w-full"
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
              >
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-medium text-amber-800">Search Results:</p>
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                      <div>
                        <h4 className="font-medium text-amber-900">
                          {result.display_name || result.username}
                        </h4>
                        <p className="text-xs text-amber-600">{result.username}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => sendFriendRequest(result.id)}
                        disabled={isLoading}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-amber-800">Invite by Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="email"
                placeholder="friend@example.com"
                value={emailInvite}
                onChange={(e) => setEmailInvite(e.target.value)}
                className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <textarea
                placeholder="Optional message..."
                rows={3}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
              />
              <Button 
                className="w-full"
                onClick={handleSendEmailInvite}
                disabled={friendsLoading || !emailInvite.trim()}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {friendsLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </CardContent>
          </Card>

          <Card className="doodle-card">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-amber-800">Quick Add</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-amber-700 mb-2">Share your friend code:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={myFriendCode?.code || 'No active code'}
                    readOnly
                    className="flex-1 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg font-mono"
                  />
                  {myFriendCode ? (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(myFriendCode.code)
                        alert('Friend code copied to clipboard!')
                      }}
                    >
                      Copy
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={handleGenerateCode}
                      disabled={friendsLoading}
                    >
                      Generate
                    </Button>
                  )}
                </div>
                {myFriendCode && (
                  <p className="text-xs text-amber-600 mt-1">
                    Expires: {new Date(myFriendCode.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-amber-700 mb-2">Add by friend code:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter friend code"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2 border border-amber-200 rounded-lg font-mono"
                    maxLength={6}
                  />
                  <Button 
                    onClick={handleAddByCode}
                    disabled={friendsLoading || !friendCode.trim()}
                  >
                    {friendsLoading ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}