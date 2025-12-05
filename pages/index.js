// pages/index.js
import { useState } from 'react';
import Web3 from 'web3';

const GROCK1_ABI = [{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"}];
const GROCK1_ADDRESS = "0x3d89b72adf26472a442a066fd0b75f18780179a3";
const BSC_RPC = "https://bsc-dataseed.binance.org/";

export default function AIChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddr = accounts[0];
        const balance = await checkGrock1Balance(web3, userArr);
        setHasToken(balance > 0);
        setIsConnected(true);
      } catch (err) {
        alert("Connection failed");
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  const checkGrock1Balance = async (web3, address) => {
    const contract = new web3.eth.Contract(GROCK1_ABI, GROCK1_ADDRESS);
    const balance = await contract.methods.balanceOf(address).call();
    return parseInt(balance) > 0;
  };

  const sendMessage = async () => {
    if (!hasToken) {
      alert("You need at least 1 GROCK1 to use AI!");
      return;
    }
    if (!input.trim()) return;

    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      const aiMsg = data.choices?.[0]?.message?.content || "Error";
      setMessages(prev => [...prev, { role: 'ai', content: aiMsg }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Failed to connect AI." }]);
    }

    setInput('');
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>🤖 GROCK1 AI Chat</h1>
      <p>Powered by LLaMA 3 | Pay with GROCK1</p>

      {!isConnected ? (
        <button onClick={connectWallet} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Connect Wallet (MetaMask)
        </button>
      ) : hasToken ? (
        <div>
          <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '10px', marginBottom: '10px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '8px 0' }}>
                <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
              </div>
            ))}
            {loading && <div>AI is thinking...</div>}
          </div>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything..."
            style={{ width: '80%', padding: '8px' }}
          />
          <button onClick={sendMessage} style={{ padding: '8px 16px' }}>Send</button>
        </div>
      ) : (
        <div>
          <p>❌ You don't have any GROCK1!</p>
          <p>Buy GROCK1 on <a href="https://pancakeswap.finance/swap?outputCurrency=0x3d89b72adf26472a442a066fd0b75f18780179a3" target="_blank">PancakeSwap</a></p>
        </div>
      )}
    </div>
  );
}
