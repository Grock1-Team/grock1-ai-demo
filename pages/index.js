// pages/index.js
import { useEffect, useState } from 'react';

export default function AIChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [address, setAddress] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const GROCK1_ABI = [
    {
      "constant": true,
      "inputs": [{ "name": "_owner", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "name": "balance", "type": "uint256" }],
      "type": "function"
    }
  ];
  const GROCK1_ADDRESS = "0x3d89b72adf26472a442a066fd0b75f18780179a3";
  const BSC_CHAIN_ID = "0x38"; // Binance Smart Chain Mainnet

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new (await import('web3')).default(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        const userAddr = accounts[0];
        setAddress(userAddr);

        // Switch to BSC if needed
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== BSC_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: BSC_CHAIN_ID }]
            });
          } catch (switchError) {
            alert("Please switch to Binance Smart Chain (BSC) in your wallet.");
            return;
          }
        }

        // Check GROCK1 balance
        const contract = new web3.eth.Contract(GROCK1_ABI, GROCK1_ADDRESS);
        const balance = await contract.methods.balanceOf(userAddr).call();
        const hasGrock = Number(balance) > 0;
        setHasToken(hasGrock);
        setIsConnected(true);
      } catch (err) {
        console.error(err);
        alert("Failed to connect wallet.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const sendMessage = async () => {
    if (!hasToken) {
      alert("You need at least 1 GROCK1 token to use the AI!");
      return;
    }
    if (!input.trim()) return;

    setLoading(true);
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });

      if (!res.ok) throw new Error('AI service error');
      const data = await res.json();
      const aiMessage = { role: 'ai', content: data.choices?.[0]?.message?.content || "No response." };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "AI is unavailable right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>🤖 GROCK1 AI Chat</h1>
      <p>Powered by LLaMA 3 • Pay with GROCK1 Token</p>

      {!isConnected ? (
        <button
          onClick={connectWallet}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#1e88e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Connect MetaMask (BSC Required)
        </button>
      ) : hasToken ? (
        <div>
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              height: '400px',
              overflowY: 'auto',
              padding: '12px',
              marginBottom: '12px',
              backgroundColor: '#f9f9f9'
            }}
          >
            {messages.length === 0 ? (
              <p style={{ color: '#888' }}>Ask anything... (e.g., "What is GROCK1?")</p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    margin: '10px 0',
                    padding: '8px',
                    backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f1f8e9',
                    borderRadius: '8px'
                  }}
                >
                  <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
                </div>
              ))
            )}
            {loading && <p>AI is thinking...</p>}
          </div>
          <div style={{ display: 'flex' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '10px',
                marginRight: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: '10px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ffccbc', borderRadius: '8px' }}>
          <h3>❌ No GROCK1 Found!</h3>
          <p>You need at least <strong>1 GROCK1</strong> to use this AI.</p>
          <p>
            Buy on{' '}
            <a
              href="https://pancakeswap.finance/swap?outputCurrency=0x3d89b72adf26472a442a066fd0b75f18780179a3"
              target="_blank"
              rel="noopener noreferrer"
            >
              PancakeSwap
            </a>
          </p>
        </div>
      )}

      <footer style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        <p>GROCK1 AI Demo — Built on BSC • Powered by Groq + LLaMA 3</p>
      </footer>
    </div>
  );
}
