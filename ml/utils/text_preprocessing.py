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
    Looks for patterns like 'X Trust', 'Z Society', 'Sansthan X', 'Seva Mandal Y', 'Mahila Samiti Z'.
    Note: Bare 'mandal' and 'samiti' are excluded to prevent false positives on AP/Telangana 
    administrative units and Panchayat Samiti government local bodies.
    """
    full_text = f"{description} {ida}"
    norm = normalize_text(full_text)
    words = norm.split()
    
    keywords = ["trust", "society", "sansthan", "ngo", "foundation"]
    phrase_keywords = [
        "seva mandal", "mahila mandal", "yuva mandal", "kalyan mandal",
        "seva samiti", "mahila samiti", "yuva samiti", "kalyan samiti", "vikas samiti"
    ]
    
    matched_phrases = []
    
    # 1. Check specific multi-word mandal phrases
    for phrase in phrase_keywords:
        if phrase in norm:
            p_words = phrase.split()
            for idx in range(len(words) - 1):
                if words[idx] == p_words[0] and words[idx+1] == p_words[1]:
                    start = max(0, idx - 1)
                    end = min(len(words), idx + 3)
                    matched_phrases.append("_".join(words[start:end]))
                    break
                    
    # 2. Check single-word keywords
    for idx, w in enumerate(words):
        if w in keywords:
            start = max(0, idx - 2)
            end = min(len(words), idx + 3)
            matched_phrases.append("_".join(words[start:end]))
            
    if matched_phrases:
        return matched_phrases[0]
    return ""
