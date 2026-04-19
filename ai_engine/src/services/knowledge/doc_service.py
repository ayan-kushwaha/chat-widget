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
        # Exact Tokenizer (Tiktoken)
        import tiktoken
        self.tokenizer = tiktoken.get_encoding("cl100k_base")

    async def save_temp_file(self, file: UploadFile) -> str:
        """Saves uploaded file to temp disk for processing."""
        temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return temp_filename

    async def parse_document(self, file: UploadFile, doc_id: str = None, org_id: str = None):
        """
        Parses PDF/DOCX/TXT/MD using LangChain Loaders.
        """
        temp_path = await self.save_temp_file(file)
        full_text = ""
        filename = file.filename.lower()
        
        try:
            logger.info(f" Processing document: {file.filename}")
            
            # 1. PDF Handling
            if filename.endswith('.pdf'):
                try:
                    # Advanced Extraction using PyMuPDF (No Poppler/Tesseract required on Windows)
                    from langchain_community.document_loaders import PyMuPDFLoader
                    loader = PyMuPDFLoader(temp_path)
                    docs = loader.load()
                    full_text = "\n\n".join([d.page_content for d in docs])
                    
                    if len(full_text.strip()) < 50:
                        logger.warning(f" Extracted PDF text is suspiciously short ({len(full_text)} chars). It might be an image-based scanned PDF.")
                except Exception as e:
                    logger.error(f" PyMuPDF Loader failed. Error: {e}")
                    raise e

            # 2. DOCX Handling
            elif filename.endswith('.docx'):
                from langchain_community.document_loaders import Docx2txtLoader
                loader = Docx2txtLoader(temp_path)
                docs = loader.load()
                full_text = "\n\n".join([d.page_content for d in docs])

            # 3. Text/Markdown Handling
            elif filename.endswith('.txt') or filename.endswith('.md') or filename.endswith('.csv') or filename.endswith('.json'):
                from langchain_community.document_loaders import TextLoader
                loader = TextLoader(temp_path, encoding="utf-8", autodetect_encoding=True)
                docs = loader.load()
                full_text = "\n\n".join([d.page_content for d in docs])
                
            # 4. Image / Vision OCR Handling (Gemini 2.0 Precision Markdown)
            elif filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')):
                logger.info(f" Running Vision OCR on {filename} for Markdown Extraction...")
                from src.core.gemini_client import gemini_client
                from src.config.model_routing import master_model_router, TaskType
                from PIL import Image
                
                route = await master_model_router.get_route(TaskType.DOC_METADATA)
                img = Image.open(temp_path)
                
                prompt = (
                    "Extract all text from this image exactly as written. "
                    "CRITICAL: Output the entire content STRICTLY in Markdown format. "
                    "Preserve all headings (use ##), bullet points (use -), and paragraphs. "
                    "If there is a table, format it strictly as a Markdown table (e.g. | Col1 | Col2 |). "
                    "Do NOT output jumbled raw text or HTML. Just pure Markdown."
                )
                
                #  Use Native Async Client (client.aio)
                response = await gemini_client.aio.models.generate_content(
                    model=route["model_name"],
                    contents=[img, prompt]
                )
                
                full_text = response.text.strip() if response and response.text else ""
            
            else:
                 # Generic Fallback (Try generic text read)
                 with open(temp_path, "r", encoding="utf-8", errors="ignore") as f:
                     full_text = f.read()
            
            #  EXACT TOKEN CALCULATION (Tiktoken)
            token_count = len(self.tokenizer.encode(full_text))
            logger.info(f" Extracted {len(full_text)} chars | {token_count} TOKENS from {file.filename}")

            # 3. Semantic Chunking (Replaces chunker.ts)
            chunks = self.text_splitter.split_text(full_text)
            logger.info(f" Created {len(chunks)} semantic chunks")

            # 4.  Zero-Cost AI Tagging (RAKE)
            from src.services.knowledge.keyword_service import keyword_service
            ai_tags = keyword_service.extract_keywords(full_text, top_n=5)
            logger.info(f" Generated AI Tags: {ai_tags}")

            #  5. NEURAL INDEXER  Page Indexing (Vectorless RAG Tree)
            page_index_info = None
            if doc_id and org_id:
                try:
                    from src.services.neural.indexer import neural_indexer
                    from src.database.mongo import db
                    
                    if db.client:
                        logger.info(f" [DocService] Triggering Neural Indexer for {file.filename} using {len(chunks)} chunks...")
                        page_index_info = await neural_indexer.index_document(
                            chunks=chunks,
                            doc_id=doc_id,
                            org_id=org_id,
                            filename=file.filename,
                            db=db.client.cluaiz
                        )
                    else:
                        logger.warning(" Database not connected. Skipping Neural Indexing.")
                except Exception as ex:
                    logger.error(f" Neural Indexer failed: {ex}")

            return {
                "filename": file.filename,
                "total_chars": len(full_text),
                "token_count": token_count, #  EXACT TOKENS
                "chunks": chunks,
                "ai_tags": ai_tags, #  NEW: AI Tags
                "page_index": page_index_info, #  NEW: Neural OS
                "metadata": {"source": "ai_engine_doc_service"}
            }

        except Exception as e:
            logger.error(f" Document Parsing Failed: {str(e)}")
            raise e
        finally:
            # Cleanup temp file
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass

doc_service = DocService()
