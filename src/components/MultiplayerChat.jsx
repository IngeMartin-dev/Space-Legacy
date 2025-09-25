// START OF FILE MultiplayerChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';

const MultiplayerChat = ({ messages, onSendMessage, currentUser, socket, currentRoom }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Emit the message to the server via the onSendMessage prop
      // The server will then broadcast it back, and it will be added to `messages` state in MultiplayerScreen
      onSendMessage(newMessage.trim()); 
      setNewMessage('');
    }
  };

  return (
    <div className="bg-black/60 rounded-xl p-4 w-96 h-96 flex flex-col border border-purple-600 shadow-xl shadow-purple-900/30"> {/* Added decoration */}
      <div className="flex items-center space-x-2 mb-3 text-white">
        <MessageCircle size={20} className="text-yellow-400" /> {/* Icon color */}
        <span className="font-bold text-lg text-yellow-300">Chat de Sala</span> {/* Text color */}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2 custom-scrollbar"> {/* Added custom-scrollbar and padding */}
        {(messages || []).map((message, index) => ( // Asegurarse de que messages sea un array
          <div key={index} className="text-sm flex flex-col">
            <span className={`font-semibold ${message.username === currentUser ? 'text-blue-400' : 'text-green-400'}`}>
              {message.username}:
            </span>
            <span className="text-gray-300 break-words">{message.text}</span> {/* break-words for long messages */}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex space-x-2 mt-auto">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-900 border border-purple-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400" 
          maxLength={100}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 px-4 py-2 rounded-lg transition-colors flex items-center justify-center" 
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MultiplayerChat;
// END OF FILE MultiplayerChat.jsx