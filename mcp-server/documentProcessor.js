import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DocumentProcessor {
  constructor(docFolder) {
    this.docFolder = docFolder;
    this.documents = new Map();
    this.vectorStore = [];
  }

  async initialize() {
    console.log('📚 Initializing Document Processor...');
    await this.loadAllDocuments();
    console.log(`✅ Loaded ${this.documents.size} documents`);
  }

  async loadAllDocuments() {
    try {
      const files = await fs.readdir(this.docFolder);
      // Load TXT files instead of PDFs for better performance and accuracy
      const txtFiles = files.filter(file => file.endsWith('.txt'));

      for (const file of txtFiles) {
        await this.processDocument(file);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  async processDocument(filename) {
    try {
      const filePath = path.join(this.docFolder, filename);
      
      // Read text file directly (much faster and more accurate than PDF parsing)
      const text = await fs.readFile(filePath, 'utf-8');
      
      // Clean and normalize the text
      let cleanedText = text
        .replace(/\n{3,}/g, '\n\n')
        .replace(/�/g, '')
        .normalize('NFC');

      const docData = {
        filename,
        text: cleanedText,
        pages: Math.ceil(cleanedText.length / 3000), // Estimate pages based on character count
        chunks: this.chunkText(cleanedText, 1000),
        metadata: {
          loadedAt: new Date().toISOString(),
          size: text.length,
          hasArabic: /[\u0600-\u06FF]/.test(cleanedText),
          encoding: 'UTF-8',
          source: 'TXT file'
        }
      };

      this.documents.set(filename, docData);
      this.indexDocument(filename, docData);

      console.log(`📄 Processed: ${filename} (${docData.pages} pages)${docData.metadata.hasArabic ? ' [Arabic content detected]' : ''}`);
      return docData;
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
      return null;
    }
  }

  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    // For Arabic text, use word boundaries instead of character count
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    if (hasArabic) {
      // Split by sentences for Arabic content (better context preservation)
      const sentences = text.match(/[^.!?؟۔]+[.!?؟۔]+/g) || [text];
      let currentChunk = '';
      let currentStart = 0;

      sentences.forEach((sentence) => {
        if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            start: currentStart,
            end: currentStart + currentChunk.length
          });
          // Keep last part for overlap
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
      // Original chunking for English/Latin text
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);
        chunks.push({
          text: chunk,
          start,
          end
        });
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
    // Enhanced search for both Arabic and English
    const queryLower = query.toLowerCase();
    const queryNormalized = query.normalize('NFC');
    
    // Detect if query is in Arabic
    const isArabicQuery = /[\u0600-\u06FF]/.test(query);
    
    // Extract terms based on language
    const queryTerms = isArabicQuery 
      ? queryNormalized.split(/\s+/).filter(term => term.length > 1)
      : queryLower.split(/\s+/).filter(term => term.length > 3);

    const scoredChunks = this.vectorStore.map(chunk => {
      const chunkLower = chunk.text.toLowerCase();
      const chunkNormalized = chunk.text.normalize('NFC');
      let score = 0;

      queryTerms.forEach(term => {
        const searchText = isArabicQuery ? chunkNormalized : chunkLower;
        const searchTerm = isArabicQuery ? term : term.toLowerCase();
        
        // Count occurrences
        const count = (searchText.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += count * (isArabicQuery ? 2 : 1); // Boost Arabic matches
      });

      // Boost if multiple terms appear together
      if (score > 0) {
        const searchText = isArabicQuery ? chunkNormalized : chunkLower;
        const searchQuery = isArabicQuery ? queryNormalized : queryLower;
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
      size: data.metadata.size
    }));
  }

  async removeDocument(filename) {
    this.documents.delete(filename);
    this.vectorStore = this.vectorStore.filter(chunk => chunk.filename !== filename);
    console.log(`🗑️ Removed: ${filename}`);
  }
}
