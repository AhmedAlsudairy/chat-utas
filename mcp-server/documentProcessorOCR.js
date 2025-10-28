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
      // For Arabic: split by sentences and paragraphs
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
          
          // Create overlap with last sentences
          const overlapText = currentChunk.slice(-overlap);
          currentStart += currentChunk.length - overlapText.length;
          currentChunk = overlapText + sentence;
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
      // English: smart chunking by paragraphs and sentences
      const paragraphs = text.split(/\n\n+/);
      let currentChunk = '';
      let currentStart = 0;
      let textPosition = 0;

      paragraphs.forEach((paragraph) => {
        const trimmedPara = paragraph.trim();
        
        if (!trimmedPara) {
          textPosition += paragraph.length + 2;
          return;
        }

        // If adding this paragraph exceeds chunk size
        if ((currentChunk + '\n\n' + trimmedPara).length > chunkSize && currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            start: currentStart,
            end: currentStart + currentChunk.length
          });
          
          // Create overlap
          const sentences = currentChunk.match(/[^.!?]+[.!?]+/g) || [currentChunk];
          const lastSentences = sentences.slice(-2).join(' ');
          const overlapText = lastSentences.length > overlap ? lastSentences.slice(-overlap) : lastSentences;
          
          currentStart = textPosition - overlapText.length;
          currentChunk = overlapText + '\n\n' + trimmedPara;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
          if (!currentChunk || currentStart === 0) {
            currentStart = textPosition;
          }
        }
        
        textPosition += paragraph.length + 2;
      });

      // Add final chunk
      if (currentChunk.trim().length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          start: currentStart,
          end: currentStart + currentChunk.length
        });
      }

      // If no paragraphs found, fallback to character-based
      if (chunks.length === 0) {
        let start = 0;
        while (start < text.length) {
          const end = Math.min(start + chunkSize, text.length);
          
          // Try to break at sentence boundary
          let breakPoint = end;
          if (end < text.length) {
            const nextPeriod = text.indexOf('.', end - 100);
            if (nextPeriod !== -1 && nextPeriod < end + 100) {
              breakPoint = nextPeriod + 1;
            }
          }
          
          const chunk = text.slice(start, breakPoint).trim();
          if (chunk.length > 0) {
            chunks.push({ text: chunk, start, end: breakPoint });
          }
          start = breakPoint - overlap;
        }
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
    
    // Extract query terms with better filtering
    const queryTerms = isArabicQuery 
      ? queryNormalized.split(/\s+/).filter(term => term.length > 1)
      : query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

    const scoredChunks = this.vectorStore.map(chunk => {
      const chunkNormalized = chunk.text.normalize('NFC');
      const searchText = isArabicQuery ? chunkNormalized : chunk.text.toLowerCase();
      const searchQuery = isArabicQuery ? queryNormalized : query.toLowerCase();
      
      let score = 0;

      // 1. Exact phrase match (highest priority)
      if (searchText.includes(searchQuery)) {
        score += 50;
      }

      // 2. Term frequency scoring with position weight
      queryTerms.forEach(term => {
        const searchTerm = isArabicQuery ? term : term.toLowerCase();
        const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = searchText.match(regex) || [];
        
        // Count occurrences with diminishing returns
        const termCount = Math.min(matches.length, 5);
        score += termCount * (isArabicQuery ? 3 : 2);
        
        // Bonus for term appearing in first 200 chars
        const firstPart = searchText.substring(0, 200);
        if (firstPart.includes(searchTerm)) {
          score += 5;
        }
      });

      // 3. Multiple term proximity bonus
      if (queryTerms.length > 1) {
        let foundTerms = 0;
        queryTerms.forEach(term => {
          const searchTerm = isArabicQuery ? term : term.toLowerCase();
          if (searchText.includes(searchTerm)) {
            foundTerms++;
          }
        });
        
        // Bonus if multiple terms found in same chunk
        if (foundTerms > 1) {
          score += foundTerms * 8;
        }
        
        // Extra bonus for all terms present
        if (foundTerms === queryTerms.length) {
          score += 15;
        }
      }

      // 4. Partial word matching (stem matching for English)
      if (!isArabicQuery) {
        queryTerms.forEach(term => {
          if (term.length > 4) {
            const stem = term.substring(0, term.length - 2);
            const stemRegex = new RegExp(`\\b${stem}\\w*`, 'gi');
            const stemMatches = searchText.match(stemRegex) || [];
            score += stemMatches.length * 0.5;
          }
        });
      }

      // 5. Document-level boost (prefer certain documents if they match)
      const docData = this.documents.get(chunk.filename);
      if (docData && docData.metadata.hasArabic === isArabicQuery) {
        score += 2; // Slight boost for language match
      }

      return { ...chunk, score };
    });

    // Filter and sort results
    const results = scoredChunks
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => {
        // Primary sort: by score
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Secondary sort: prefer earlier chunks if scores equal
        return a.chunkIndex - b.chunkIndex;
      })
      .slice(0, topK);

    // Normalize scores to 0-1 range for display
    if (results.length > 0) {
      const maxScore = results[0].score;
      results.forEach(result => {
        result.score = result.score / maxScore;
      });
    }

    return results;
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
