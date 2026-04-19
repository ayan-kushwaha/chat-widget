from fastapi import UploadFile
from langchain_community.document_loaders import UnstructuredPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.utils.logger import logger
import os
import shutil
import uuid

class DocService:
    def __init__(self):
        # Semantic Chunking Config
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,           # Max limit 4000 (3k-4k range)
            chunk_overlap=200,         # Small overlap for safety
            # Smart separators for English, Hindi, Chinese, Urdu, Japanese
            separators=["\n\n", "\n", "", "", "", ".", "?", "!", " ", ""], 
            keep_separator=True        # Retain punctuation and paragraphs
        )

    async def save_temp_file(self, file: UploadFile) -> str:
        """Saves uploaded file to temp disk for processing."""
        temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return temp_filename

    async def parse_document(self, file: UploadFile):
        """
        Parses PDF/Docs using Advanced Unstructured Loader.
        Replaces Node.js pdfReader.ts
        """
        temp_path = await self.save_temp_file(file)
        
        try:
            logger.info(f" Processing document: {file.filename}")
            
            # 1. Load & Extract (Handles Tables & Layouts better than pdf-parse)
            loader = UnstructuredPDFLoader(temp_path, mode="elements")
            docs = loader.load()
            
            full_text = "\n\n".join([d.page_content for d in docs])
            logger.info(f" Extracted {len(full_text)} chars from {file.filename}")

            # 2. Semantic Chunking (Replaces chunker.ts)
            chunks = self.text_splitter.split_text(full_text)
            logger.info(f" Created {len(chunks)} semantic chunks")

            return {
                "filename": file.filename,
                "total_chars": len(full_text),
                "chunks": chunks,
                "metadata": {"source": "ai_engine_doc_service"}
            }

        except Exception as e:
            logger.error(f" Document Parsing Failed: {str(e)}")
            raise e
        finally:
            # Cleanup temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

doc_service = DocService()
