import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extracts text from a file (Image or PDF).
 * @param {File} file 
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromFile = async (file) => {
  const fileType = file.type;

  if (fileType.startsWith('image/')) {
    return await extractTextFromImage(file);
  } else if (fileType === 'application/pdf') {
    return await extractTextFromPDF(file);
  }
  throw new Error('Unsupported file type. Please upload a PDF or an Image (PNG, JPG).');
};

const extractTextFromImage = async (imageFile) => {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
};

const extractTextFromPDF = async (pdfFile) => {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
    
    // If the page has very little text, it might be a scanned PDF.
    // In a production app, we would render the page to a canvas and run OCR.
    // For this MVP, we'll try to extract what's there.
  }

  if (fullText.trim().length < 50) {
      // Potentially a scanned PDF - we should mention this or try OCR on the first page
      console.warn("Extracted text is very short. This might be a scanned PDF.");
  }

  return fullText;
};
