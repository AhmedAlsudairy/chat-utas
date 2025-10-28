import dotenv from 'dotenv';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import OpenAI from 'openai';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocumentProcessorOCR } from './documentProcessorOCR.js';
import { MCPProtocol } from './mcpProtocol.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Document Processor with OCR
const docFolder = path.join(__dirname, '..', process.env.DOC_FOLDER || './doc');
const documentProcessor = new DocumentProcessorOCR(docFolder);

// Initialize MCP Protocol
const mcp = new MCPProtocol();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', documents: documentProcessor.getDocumentsList() });
});

// Register MCP Protocol Handlers
mcp.registerHandler('documents.list', async () => {
  return { documents: documentProcessor.getDocumentsList() };
});

mcp.registerHandler('documents.search', async (params) => {
  const { query, topK = 5 } = params;
  const results = documentProcessor.searchDocuments(query, topK);
  return { results };
});

mcp.registerHandler('chat.query', async (params, ws) => {
  const { question, conversationHistory = [] } = params;
  
  try {
    // Step 1: Search relevant document chunks
    const relevantChunks = documentProcessor.searchDocuments(question, 5);
    
    if (relevantChunks.length === 0) {
      // Detect if question is in Arabic
      const isArabicQuestion = /[\u0600-\u06FF]/.test(question);
      const noAnswerMessage = isArabicQuestion 
        ? "لم أجد معلومات محددة في المستندات المتاحة للإجابة على هذا السؤال. هل يمكنك إعادة صياغة السؤال أو السؤال عن موضوع آخر متعلق بالأنظمة الأكاديمية أو التقسيمات الإدارية للجامعة؟"
        : "I couldn't find specific information in the available documents to answer this question directly. Could you rephrase your question or ask about topics related to the academic system, administrative divisions, or university regulations?";
      
      return {
        answer: noAnswerMessage,
        sources: [],
        hasAnswer: false
      };
    }

    // Step 2: Prepare context from documents
    const context = relevantChunks.map((chunk, idx) => 
      `[Document ${idx + 1}: ${chunk.filename}]\n${chunk.text}`
    ).join('\n\n---\n\n');

    // Step 3: Build messages for GPT
    const systemMessage = {
      role: 'system',
      content: `You are a helpful, knowledgeable assistant for university documents. Your primary role is to help users understand academic regulations, administrative decisions, and policies.

RESPONSE GUIDELINES:
1. Base your answers primarily on the provided documents
2. You may provide general context or explanations to help understanding, but clearly indicate when you're doing so
3. If the exact answer isn't in the documents but you can infer it from related information, explain your reasoning
4. For questions partially covered in documents, answer what you can and note what's not explicitly stated
5. Always cite which document you're referencing when using specific information
6. Be helpful and educational - provide context and explanations when useful
7. If a question is completely outside the documents, politely redirect to document-related topics

LANGUAGE RULES:
- For Arabic content or Arabic questions: Respond in clear, formal Arabic (Modern Standard Arabic)
- For English content or English questions: Respond in clear, professional English
- Match the language of the question when possible
- Preserve the original meaning and context from the documents
- Use proper formatting with line breaks for better readability

FORMATTING (IMPORTANT):
- Use ### for main section headers
- Use ## for subsection headers  
- Use # for minor headers
- Use - or * for bullet points (one per line)
- Use 1. 2. 3. for numbered lists
- Add line breaks to separate different points
- Keep paragraphs short and focused
- Add spacing between main ideas

EXAMPLE FORMAT:
### Main Topic
Brief introduction here.

- Point one with details
- Point two with details
- Point three with details

### Another Section
More information here.

FLEXIBILITY:
- You can provide helpful context even if not explicitly in the documents
- You can explain general university procedures or academic concepts
- You can make reasonable inferences from the provided information
- Just be clear about what's from documents vs. general knowledge

Available documents context:
${context}`
    };

    const messages = [
      systemMessage,
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: question
      }
    ];

    // Step 4: Send real-time status update
    const isArabicQuestion = /[\u0600-\u06FF]/.test(question);
    const statusMessage = isArabicQuestion 
      ? 'جارٍ البحث في المستندات وإنشاء الإجابة...'
      : 'Searching documents and generating answer...';
    
    mcp.sendNotification(ws, 'chat.status', {
      status: 'processing',
      message: statusMessage
    });

    // Step 5: Get GPT response with streaming
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: messages,
      max_completion_tokens: 1000,
      stream: true
    });

    let fullAnswer = '';
    
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullAnswer += content;
        // Send real-time chunks to client
        mcp.sendNotification(ws, 'chat.chunk', {
          chunk: content,
          complete: false
        });
      }
    }

    // Send completion notification
    mcp.sendNotification(ws, 'chat.chunk', {
      chunk: '',
      complete: true
    });

    const sources = relevantChunks.map(chunk => ({
      filename: chunk.filename,
      chunkIndex: chunk.chunkIndex,
      preview: chunk.text.substring(0, 200) + '...',
      score: chunk.score
    }));

    return {
      answer: fullAnswer,
      sources,
      hasAnswer: true,
      relevantChunks: relevantChunks.length
    };

  } catch (error) {
    console.error('Error in chat query:', error);
    mcp.sendNotification(ws, 'chat.error', {
      message: error.message
    });
    throw error;
  }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 New client connected');

  // Send initial state
  mcp.sendNotification(ws, 'documents.updated', {
    documents: documentProcessor.getDocumentsList()
  });

  ws.on('message', (message) => {
    mcp.handleMessage(ws, message.toString());
  });

  ws.on('close', () => {
    console.log('👋 Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// File watcher for real-time document updates (Event Pattern)
const watcher = chokidar.watch(docFolder, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('add', async (filePath) => {
    const filename = path.basename(filePath);
    if (filename.endsWith('.pdf')) {
      console.log(`📄 New document detected: ${filename}`);
      await documentProcessor.processDocument(filename);
      
      // Broadcast update to all connected clients
      mcp.broadcastEvent(wss, 'documents.added', {
        filename,
        documents: documentProcessor.getDocumentsList()
      });
    }
  })
  .on('unlink', async (filePath) => {
    const filename = path.basename(filePath);
    if (filename.endsWith('.pdf')) {
      console.log(`🗑️ Document removed: ${filename}`);
      await documentProcessor.removeDocument(filename);
      
      // Broadcast update to all connected clients
      mcp.broadcastEvent(wss, 'documents.removed', {
        filename,
        documents: documentProcessor.getDocumentsList()
      });
    }
  })
  .on('change', async (filePath) => {
    const filename = path.basename(filePath);
    if (filename.endsWith('.pdf')) {
      console.log(`📝 Document updated: ${filename}`);
      await documentProcessor.removeDocument(filename);
      await documentProcessor.processDocument(filename);
      
      // Broadcast update to all connected clients
      mcp.broadcastEvent(wss, 'documents.updated', {
        filename,
        documents: documentProcessor.getDocumentsList()
      });
    }
  });

// Initialize and start server
async function start() {
  try {
    await documentProcessor.initialize();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 MCP RAG Server Running           ║
╠════════════════════════════════════════╣
║   HTTP: http://localhost:${PORT}        ║
║   WebSocket: ws://localhost:${PORT}     ║
║   Documents: ${documentProcessor.documents.size} loaded              ║
║   OCR: Enabled (Arabic + English) ✅  ║
║   Status: Ready ✅                     ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await documentProcessor.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await documentProcessor.cleanup();
  process.exit(0);
});

start();
