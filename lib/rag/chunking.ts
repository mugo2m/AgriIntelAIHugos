// lib/rag/chunking.ts
interface Chunk {
  content: string;
  metadata: Record<string, any>;
  index: number;
}

export function chunkDocument(
  text: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    metadata?: Record<string, any>;
  } = {}
): Chunk[] {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    metadata = {}
  } = options;

  const chunks: Chunk[] = [];

  // Clean text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()-]/g, '')
    .trim();

  if (cleanText.length <= chunkSize) {
    return [{
      content: cleanText,
      metadata,
      index: 0
    }];
  }

  // Smart chunking by sentences
  const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          metadata,
          index: chunkIndex++
        });
      }

      // Start new chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(chunkOverlap / 10)).join(' ');
      currentChunk = overlapWords + ' ' + sentence;
    }
  }

  // Add last chunk
  if (currentChunk) {
    chunks.push({
      content: currentChunk.trim(),
      metadata,
      index: chunkIndex
    });
  }

  console.log(`✅ Created ${chunks.length} chunks from document`);
  return chunks;
}

export function chunkByPages(
  pages: { text: string; pageNumber: number }[],
  metadata: Record<string, any> = {}
): Chunk[] {
  const chunks: Chunk[] = [];

  pages.forEach((page, idx) => {
    const pageChunks = chunkDocument(page.text, {
      metadata: {
        ...metadata,
        pageNumber: page.pageNumber,
        chunkInPage: idx
      }
    });
    chunks.push(...pageChunks);
  });

  return chunks;
}

export function chunkTable(
  tableData: any[],
  headers: string[],
  metadata: Record<string, any> = {}
): Chunk[] {
  const chunks: Chunk[] = [];

  // Convert table to readable text
  const headerRow = headers.join(' | ');

  tableData.forEach((row, idx) => {
    const rowValues = headers.map(h => row[h] || '').join(' | ');
    const content = `Table data - Headers: ${headerRow}\nRow ${idx + 1}: ${rowValues}`;

    chunks.push({
      content,
      metadata: {
        ...metadata,
        tableRow: idx + 1,
        tableHeaders: headers
      },
      index: idx
    });
  });

  return chunks;
}