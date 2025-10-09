import { useState } from 'react'
import { useChatKit, ChatKit } from '@openai/chatkit-react'

function ChatInterface() {
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  const chatKitProps = useChatKit({
    api: {
      url: '/api/chatkit',
      domainKey: 'domain_pk_localhost_dev'
    },
    onConnect: () => {
      console.log('ChatKit connected')
      setConnectionStatus('connected')
      setError(null)
    },
    onDisconnect: () => {
      console.log('ChatKit disconnected')
      setConnectionStatus('disconnected')
    },
    onError: ({ error }) => {
      console.error('ChatKit error:', error)
      setError(error.message || 'An error occurred')
      setConnectionStatus('error')
    },
  })

  return (
    <div className="w-full max-w-2xl">
      {/* Status Indicator */}
      <div className="mb-4 flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'error' ? 'bg-red-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-gray-400'
          }`} />
          <span className="text-sm font-medium text-gray-700">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'error' ? 'Connection Error' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             'Disconnected'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ChatKit Component */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-[600px] w-full">
          <ChatKit {...chatKitProps} />
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Start chatting with the AI agent. Your conversation is secure and private.</p>
      </div>
    </div>
  )
}

export default ChatInterface
