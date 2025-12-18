import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Basic PII Redaction to protect user privacy
 */
export const redactPII = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}/g; // Indian phone patterns

    return text
        .replace(emailRegex, "[EMAIL REDACTED]")
        .replace(phoneRegex, "[PHONE REDACTED]");
};

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
    }
    return fullText;
};
