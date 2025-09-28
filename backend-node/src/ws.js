const WebSocket = require('ws');

const attachWebSocket = (server) => {
  const wss = new WebSocket.Server({ server, path: '/ws/status' });

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'welcome', ts: new Date().toISOString() }));
  });

  const broadcast = (payload) => {
    const data = JSON.stringify({ type: 'status_update', payload });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  return { broadcast };
};

module.exports = attachWebSocket;
