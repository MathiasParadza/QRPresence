import React, { useState } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

const AIChatAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);

  const token = localStorage.getItem('accessToken');

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { role: 'user', text: query };
    setChatHistory((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await axios.post<{ answer: string }>(
        '/api/ai-chat/',
        { query },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const botMessage = { role: 'bot', text: res.data.answer };
      setChatHistory((prev) => [...prev, botMessage]);
      setChatHistory((prev) => [...prev, botMessage]);
    } catch {
      const errorMsg = 'Error processing your question.';
      setChatHistory((prev) => [...prev, { role: 'bot', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow rounded-lg border">
      <h2 className="text-xl font-bold mb-4">AI Attendance Assistant</h2>

      <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask about attendance..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? 'Sending...' : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default AIChatAssistant;
