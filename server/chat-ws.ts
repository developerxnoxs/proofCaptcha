import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { getStorage } from './storage';
import type { InsertChatMessage } from '@shared/schema';
import type { IncomingMessage } from 'http';
import { parse as parseCookie } from 'cookie';
import signature from 'cookie-signature';

export interface AuthenticatedWebSocket extends WebSocket {
  developerId?: string;
  developerName?: string;
  developerEmail?: string;
  isAlive?: boolean;
}

// Parse session from cookie
function parseSessionFromRequest(req: IncomingMessage, sessionSecret: string): any {
  try {
    const cookies = parseCookie(req.headers.cookie || '');
    const sessionCookie = cookies['connect.sid'];
    
    if (!sessionCookie) {
      return null;
    }

    // Remove 's:' prefix and decode signature
    const cookieValue = sessionCookie.startsWith('s:') ? sessionCookie.slice(2) : sessionCookie;
    const unsigned = signature.unsign(cookieValue, sessionSecret);
    
    if (!unsigned) {
      return null;
    }

    // For express-session with default memory store, the session ID is just the unsigned value
    // The actual session data is in memory, we'll need to validate differently
    return { sessionId: unsigned };
  } catch (error) {
    console.error('[WebSocket] Error parsing session:', error);
    return null;
  }
}

export async function setupChatWebSocket(server: Server, sessionSecret: string, getSessionStore: () => any) {
  const wss = new WebSocketServer({ 
    noServer: true,
  });

  const storage = await getStorage();

  // Handle WebSocket upgrade with session validation
  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    
    if (url.pathname === '/ws/chat') {
      // Parse session from cookie
      const sessionInfo = parseSessionFromRequest(request, sessionSecret);
      const clientIP = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
      
      if (!sessionInfo) {
        console.log(`[WebSocket] SECURITY: No valid session cookie from IP ${clientIP}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Get session data from store
      const sessionStore = getSessionStore();
      sessionStore.get(sessionInfo.sessionId, (err: any, sessionData: any) => {
        if (err || !sessionData || !sessionData.developerId) {
          console.log(`[WebSocket] SECURITY: Invalid or unauthenticated session ID ${sessionInfo.sessionId} from IP ${clientIP}`);
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        // Attach session data to request for connection handler
        (request as any).sessionData = sessionData;

        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      });
    }
  });

  // Heartbeat mechanism to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating dead connection');
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    const sessionData = (req as any).sessionData;
    
    if (!sessionData || !sessionData.developerId) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Fetch full developer info from database
    const developer = await storage.getDeveloperById(sessionData.developerId);
    
    if (!developer) {
      ws.close(1008, 'Developer not found');
      return;
    }

    // Authenticate the WebSocket connection with server-verified identity
    ws.developerId = developer.id;
    ws.developerName = developer.name;
    ws.developerEmail = developer.email;
    ws.isAlive = true;

    console.log(`[WebSocket] User authenticated: ${developer.email}`);
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    ws.on('message', async (data) => {
      try {
        // Parse incoming message
        let message;
        try {
          message = JSON.parse(data.toString());
        } catch (parseError) {
          console.error('[WebSocket] JSON parse error:', parseError);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Invalid message format - must be valid JSON' }
          }));
          return;
        }

        // Validate message structure
        if (!message || typeof message !== 'object') {
          console.error('[WebSocket] Invalid message structure:', message);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Invalid message structure' }
          }));
          return;
        }

        // Validate message type
        if (!message.type) {
          console.error('[WebSocket] Missing message type:', message);
          ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Message type is required' }
          }));
          return;
        }
        
        // Handle chat message (no encryption, just plain text for public chat)
        if (message.type === 'message') {
          // Validate payload exists
          if (!message.payload || typeof message.payload !== 'object') {
            console.error('[WebSocket] Invalid payload structure:', message);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Invalid payload structure' }
            }));
            return;
          }

          const { content } = message.payload;

          // Validate content
          if (!content || typeof content !== 'string' || content.trim().length === 0) {
            console.error('[WebSocket] Invalid content:', { content });
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Message content is required' }
            }));
            return;
          }

          // Trim and validate message length
          const trimmedContent = content.trim();
          if (trimmedContent.length > 5000) {
            console.error('[WebSocket] Content too long:', trimmedContent.length);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Message too long (max 5000 characters)' }
            }));
            return;
          }

          // Verify user is still authenticated
          if (!ws.developerId || !ws.developerName || !ws.developerEmail) {
            console.error('[WebSocket] User not authenticated:', { developerId: ws.developerId });
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Authentication required' }
            }));
            return;
          }

          // Save plain text message to database (use server-verified identity)
          const chatMessage: InsertChatMessage = {
            developerId: ws.developerId,
            developerName: ws.developerName,
            developerEmail: ws.developerEmail,
            content: trimmedContent,
          };

          let savedMessage;
          try {
            savedMessage = await storage.createChatMessage(chatMessage);
            console.log(`[WebSocket] Message saved to storage:`, { id: savedMessage.id, from: ws.developerEmail });
          } catch (storageError) {
            console.error('[WebSocket] Storage error:', storageError);
            ws.send(JSON.stringify({
              type: 'error',
              payload: { error: 'Failed to save message to database' }
            }));
            return;
          }

          // Broadcast message to all authenticated clients
          const broadcastMessage = {
            type: 'message',
            payload: {
              id: savedMessage.id,
              developerId: savedMessage.developerId,
              developerName: savedMessage.developerName,
              developerEmail: savedMessage.developerEmail,
              content: savedMessage.content,
              createdAt: savedMessage.createdAt,
            }
          };

          let broadcastCount = 0;
          wss.clients.forEach((client: AuthenticatedWebSocket) => {
            if (client.readyState === WebSocket.OPEN && client.developerId) {
              try {
                client.send(JSON.stringify(broadcastMessage));
                broadcastCount++;
              } catch (sendError) {
                console.error('[WebSocket] Error sending to client:', sendError);
              }
            }
          });

          console.log(`[WebSocket] Message broadcasted from ${ws.developerEmail} to ${broadcastCount} clients`);
        } else {
          console.log(`[WebSocket] Ignoring unknown message type: ${message.type}`);
        }

      } catch (error) {
        console.error('[WebSocket] Unexpected error processing message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        ws.send(JSON.stringify({
          type: 'error',
          payload: { error: `Failed to process message: ${errorMessage}` }
        }));
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Connection closed: ${ws.developerEmail}`);
    });

    // Send authentication success message
    ws.send(JSON.stringify({
      type: 'auth_success',
      payload: { 
        message: 'Connected successfully',
        developer: {
          id: ws.developerId,
          name: ws.developerName,
          email: ws.developerEmail
        }
      }
    }));
  });

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('[WebSocket] Chat server ready at /ws/chat');

  return wss;
}
