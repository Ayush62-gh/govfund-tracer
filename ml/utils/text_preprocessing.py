import re
import unicodedata

def normalize_text(text: str) -> str:
    """
    Cleans and normalizes text for NLP comparison:
    - Lowercases
    - Strips whitespace & special characters
    - Normalizes unicode characters
    """
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('utf-8')
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_trust_name(description: str, ida: str = "") -> str:
    """
    Extracts potential Trust/Society name from description or IDA string.
    Looks for patterns like 'X Trust', 'Y Samiti', 'Z Society', 'Sansthan X'.
    """
    full_text = f"{description} {ida}"
    norm = normalize_text(full_text)
    
    keywords = ["trust", "samiti", "society", "sansthan", "ngo", "foundation", "mandal"]
    words = norm.split()
    
    matched_phrases = []
    for idx, w in enumerate(words):
        if w in keywords:
            start = max(0, idx - 2)
            end = min(len(words), idx + 3)
            matched_phrases.append("_".join(words[start:end]))
            
    if matched_phrases:
        return matched_phrases[0]
    return ""
