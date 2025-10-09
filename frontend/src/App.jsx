import { useState } from 'react'
import ChatInterface from './components/ChatInterface'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Agent Chat
          </h1>
          <p className="text-gray-600">
            Powered by OpenAI ChatKit
          </p>
        </header>
        
        <main className="flex justify-center">
          <ChatInterface />
        </main>
        
        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>Built with React, Vite, and OpenAI ChatKit</p>
        </footer>
      </div>
    </div>
  )
}

export default App
