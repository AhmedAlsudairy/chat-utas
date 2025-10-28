import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { pdfToPng } from 'pdf-to-png-converter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DocumentProcessorOCR {
  constructor(docFolder) {
    this.docFolder = docFolder;
    this.documents = new Map();
    this.vectorStore = [];
    this.ocrWorker = null;
  }

  async initialize() {
    console.log('📚 Initializing Document Processor with OCR...');
    
    // Initialize Tesseract worker for Arabic
    this.ocrWorker = await createWorker('ara+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r   OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log('✅ OCR Worker initialized (Arabic + English)');
    await this.loadAllDocuments();
    console.log(`✅ Loaded ${this.documents.size} documents`);
  }

  async loadAllDocuments() {
    try {
      const files = await fs.readdir(this.docFolder);
      // Only load TXT files for better performance and accuracy
      const documentFiles = files.filter(file => file.endsWith('.txt'));

      for (const file of documentFiles) {
        await this.processDocument(file);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  async processDocument(filename) {
    try {
      const filePath = path.join(this.docFolder, filename);
      
      console.log(`\n📄 Processing: ${filename}`);
      
      // Handle TXT files directly
      if (filename.endsWith('.txt')) {
        const textContent = await fs.readFile(filePath, 'utf-8');
        
        const docData = {
          filename,
          text: textContent.normalize('NFC'),
          pages: 1,
          chunks: this.chunkText(textContent, 1000),
          metadata: {
            loadedAt: new Date().toISOString(),
            size: textContent.length,
            hasArabic: /[\u0600-\u06FF]/.test(textContent),
            fileType: 'text',
            encoding: 'UTF-8'
          }
        };

        this.documents.set(filename, docData);
        this.indexDocument(filename, docData);

        console.log(`✅ Processed: ${filename} (Text file)${docData.metadata.hasArabic ? ' [Arabic content detected]' : ''}`);
        return docData;
      }
      
      // Handle PDF files
      const dataBuffer = await fs.readFile(filePath);
      
      // First try standard PDF parsing
      const pdfData = await pdfParse(dataBuffer, {
        preserveSpacing: true,
        normalizeWhitespace: true,
        maxBufferLength: 10 * 1024 * 1024
      });

      let extractedText = pdfData.text.normalize('NFC');
      const hasArabic = /[\u0600-\u06FF]/.test(extractedText);
      
      // Check if text is garbled (lots of special chars and little readable text)
      const garbledChars = (extractedText.match(/[�◌♦♥♠♣]/g) || []).length;
      const isGarbled = garbledChars > 50 || (hasArabic && extractedText.includes('�'));

      // Use OCR for garbled or Arabic documents
      if (isGarbled || hasArabic) {
        console.log(`   🔍 Detected ${hasArabic ? 'Arabic' : 'garbled'} text - Using OCR...`);
        extractedText = await this.extractWithOCR(filePath, pdfData.numpages);
      }

      // Clean the text
      const cleanedText = extractedText
        .replace(/\n{3,}/g, '\n\n')
        .replace(/�/g, '')
        .trim();

      const docData = {
        filename,
        text: cleanedText,
        pages: pdfData.numpages,
        chunks: this.chunkText(cleanedText, 1000),
        metadata: {
          loadedAt: new Date().toISOString(),
          size: dataBuffer.length,
          hasArabic: /[\u0600-\u06FF]/.test(cleanedText),
          usedOCR: isGarbled || hasArabic,
          encoding: 'UTF-8'
        }
      };

      this.documents.set(filename, docData);
      this.indexDocument(filename, docData);

      console.log(`✅ Processed: ${filename} (${pdfData.numpages} pages)${docData.metadata.hasArabic ? ' [Arabic]' : ''}${docData.metadata.usedOCR ? ' [OCR]' : ''}`);
      return docData;
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
      return null;
    }
  }

  async extractWithOCR(filePath, numPages) {
    try {
      const tempDir = path.join(__dirname, '../temp');
      await fs.mkdir(tempDir, { recursive: true });

      let fullText = '';
      
      // Convert PDF pages to images
      const pngPages = await pdfToPng(filePath, {
        outputFolder: tempDir,
        viewportScale: 2.0,
        outputFileMask: 'page',
        strictPagesToProcess: false
      });

      // OCR each page
      for (let i = 0; i < Math.min(pngPages.length, numPages); i++) {
        const imagePath = pngPages[i].path;
        
        process.stdout.write(`\r   📖 OCR Page ${i + 1}/${numPages}...`);
        
        const { data: { text } } = await this.ocrWorker.recognize(imagePath);
        fullText += text + '\n\n';
        
        // Clean up temp image
        try {
          await fs.unlink(imagePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      console.log('\r   ✅ OCR Complete!                    ');
      
      // Clean up temp directory
      try {
        await fs.rmdir(tempDir);
      } catch (e) {
        // Ignore if not empty
      }

      return fullText;
    } catch (error) {
      console.error('   ❌ OCR Error:', error.message);
      throw error;
    }
  }

  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    if (hasArabic) {
      // For Arabic: split by sentences
      const sentences = text.match(/[^.!?؟۔\n]+[.!?؟۔\n]+/g) || [text];
      let currentChunk = '';
      let currentStart = 0;

      sentences.forEach((sentence) => {
        if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            start: currentStart,
            end: currentStart + currentChunk.length
          });
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + sentence;
          currentStart += currentChunk.length - overlapText.length - sentence.length;
        } else {
          currentChunk += sentence;
        }
      });

      if (currentChunk.trim().length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          start: currentStart,
          end: currentStart + currentChunk.length
        });
      }
    } else {
      // English: character-based chunking
      let start = 0;
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        chunks.push({ text: chunk, start, end });
        start += chunkSize - overlap;
      }
    }

    return chunks;
  }

  indexDocument(filename, docData) {
    docData.chunks.forEach((chunk, index) => {
      this.vectorStore.push({
        id: `${filename}_chunk_${index}`,
        filename,
        chunkIndex: index,
        text: chunk.text,
        start: chunk.start,
        end: chunk.end
      });
    });
  }

  searchDocuments(query, topK = 5) {
    const queryNormalized = query.normalize('NFC');
    const isArabicQuery = /[\u0600-\u06FF]/.test(query);
    
    const queryTerms = isArabicQuery 
      ? queryNormalized.split(/\s+/).filter(term => term.length > 1)
      : query.toLowerCase().split(/\s+/).filter(term => term.length > 3);

    const scoredChunks = this.vectorStore.map(chunk => {
      const chunkNormalized = chunk.text.normalize('NFC');
      let score = 0;

      queryTerms.forEach(term => {
        const searchText = isArabicQuery ? chunkNormalized : chunk.text.toLowerCase();
        const searchTerm = isArabicQuery ? term : term.toLowerCase();
        
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const count = (searchText.match(regex) || []).length;
        score += count * (isArabicQuery ? 2 : 1);
      });

      if (score > 0) {
        const searchText = isArabicQuery ? chunkNormalized : chunk.text.toLowerCase();
        const searchQuery = isArabicQuery ? queryNormalized : query.toLowerCase();
        if (searchText.includes(searchQuery)) {
          score += 10;
        }
      }

      return { ...chunk, score };
    });

    return scoredChunks
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  getDocumentsList() {
    return Array.from(this.documents.entries()).map(([filename, data]) => ({
      filename,
      pages: data.pages,
      chunks: data.chunks.length,
      loadedAt: data.metadata.loadedAt,
      size: data.metadata.size,
      hasArabic: data.metadata.hasArabic,
      usedOCR: data.metadata.usedOCR
    }));
  }

  async removeDocument(filename) {
    this.documents.delete(filename);
    this.vectorStore = this.vectorStore.filter(chunk => chunk.filename !== filename);
    console.log(`🗑️ Removed: ${filename}`);
  }

  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      console.log('✅ OCR Worker terminated');
    }
  }
}
