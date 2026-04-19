from rake_nltk import Rake
import nltk
from src.utils.logger import logger

class KeywordService:
    def __init__(self):
        try:
            # Ensure NLTK data is available
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            logger.info(" Downloading NLTK data for RAKE...")
            nltk.download('punkt')
            nltk.download('stopwords')
            nltk.download('punkt_tab') # Sometimes needed for newer nltk versions

        # Configure RAKE for "Smart phrases" (2-3 words) as requested
        self.r = Rake(min_length=2, max_length=3)

    def extract_keywords(self, text: str, top_n: int = 5) -> list[str]:
        """
        Extracts top keywords from text using RAKE.
        """
        try:
            if not text or len(text.strip()) < 50: # Increased threshold for meaningful extraction
                return []

            #  PREPROCESSING: Clean JSON/structured data syntax
            import re
            
            # Remove JSON syntax artifacts
            clean_text = text
            clean_text = re.sub(r'[{}\[\]":]', ' ', clean_text)  # Remove JSON brackets, quotes, colons
            clean_text = re.sub(r',', ' ', clean_text)  # Remove commas
            clean_text = re.sub(r'\s+', ' ', clean_text)  # Normalize whitespace
            
            # RAKE extraction on cleaned text
            self.r.extract_keywords_from_text(clean_text)
            
            # Get ranked phrases
            keywords = self.r.get_ranked_phrases()
            
            #  SMART FILTERING: Remove noise
            clean_keywords = []
            
            # Stopwords for business irrelevant terms
            noise_words = {
                'name', 'names', 'user', 'users', 'id', 'list', 'data', 'file',
                'employee', 'employees', 'staff', 'person', 'people', 'manager',
                'january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december',
                'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                'null', 'true', 'false',  # JSON values
                'hours', 'spent', 'email', 'phone', 'contact'  # Field names
            }
            
            for kw in keywords:
                # Skip if too short
                if len(kw) < 4:
                    continue
                
                # Skip if it's just a number or contains only digits
                if kw.replace(' ', '').isdigit():
                    continue
                
                # Skip if it looks like a personal name (all title case, no common words)
                words = kw.split()
                if len(words) >= 2 and all(w[0].isupper() and w[1:].islower() for w in words if w):
                    # Likely a name (e.g., "Rebecca Andrews", "Bryan Smith")
                    continue
                
                # Skip noise words
                lower_kw = kw.lower()
                if any(noise in lower_kw for noise in noise_words):
                    continue
                
                # Skip if contains special characters (leftover JSON artifacts)
                if re.search(r'[^a-zA-Z\s-]', kw):
                    continue
                
                # Title case for better UI
                clean_kw = kw.title()
                
                # Avoid duplicates
                if clean_kw not in clean_keywords:
                    clean_keywords.append(clean_kw)
            
            return clean_keywords[:top_n]

        except Exception as e:
            logger.error(f" Keyword Extraction Failed: {e}")
            return []

keyword_service = KeywordService()
