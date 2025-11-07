import re
import unicodedata

class CompanyAbbrev:
    LEGAL_SUFFIXES = {
        "en": ["inc", "llc", "corp", "ltd", "llp", "plc", "corporation", "limited", "company"],
        "fr": ["sa", "sarl", "sas"],
        "es": ["sa", "sl", "sau", "slne"],
        "pt": ["lda", "ltda", "sa", "me"],
        "de": ["gmbh", "ag", "kg", "ug"],
        "it": ["srl", "spa", "snc", "sas"],
        "ru": ["ооо", "зао", "оао", "ao"],
        "zh": ["有限公司", "集团", "公司"],
        "ja": ["株式会社", "有限会社"],
        "ko": ["유한회사", "주식회사"],
        "he": ["בעמ", "חברה בעמ"],
        "ar": ["شذمم", "ش.م.م", "مؤسسة", "شركة"]
    }

    NOISE_WORDS = {
        "en": ["the", "of", "and"],
        "fr": ["le", "la", "les", "de", "et"],
        "es": ["el", "la", "los", "de", "y"],
        "pt": ["o", "a", "os", "as", "de", "e"],
        "de": ["der", "die", "das", "und", "von"],
        "it": ["il", "la", "lo", "gli", "dei", "e"],
        "ru": ["и", "из", "в"],
        "zh": [],
        "ja": [],
        "ko": [],
        "he": ["של", "ו"],
        "ar": ["و", "من", "ال"]
    }

    @staticmethod
    def normalize_nfd(text: str) -> str:
        return unicodedata.normalize("NFD", text)

    @staticmethod
    def extract_existing_acronym(name: str):
        match = re.search(r"\(([A-Z]{2,6})\)\s*$", name)
        if not match:
            return name.strip(), None
        acronym = match.group(1)
        first_letter_match = re.search(r"[A-Za-z]", name)
        if not first_letter_match or acronym[0] != first_letter_match.group(0).upper():
            return name.strip(), None
        name = re.sub(r"\s*\([A-Z]{2,6}\)\s*$", "", name)
        return name.strip(), acronym

    @staticmethod
    def normalize_punctuation(name: str) -> str:
        # Keep letters, digits, spaces, &, hyphen; replace other punctuation with space
        name = re.sub(r"[^\w\s&-]+", " ", name)
        name = re.sub(r"_", " ", name)
        name = re.sub(r"\s+", " ", name)
        return name.strip()

    @classmethod
    def remove_legal_suffix(cls, name: str, lang: str):
        # Normalize name for suffix removal
        normalized = cls.normalize_punctuation(name).lower()
        for suffix in cls.LEGAL_SUFFIXES.get(lang, []):
            pattern = re.compile(r"\b" + re.escape(suffix.lower()) + r"$")
            if pattern.search(normalized):
                # Remove suffix from the normalized string
                name = re.sub(r"\b" + re.escape(suffix) + r"$", "", name, flags=re.IGNORECASE).strip()
                break
        return name

    @classmethod
    def clean_words(cls, name: str, lang: str):
        noise = set(cls.NOISE_WORDS.get(lang, []))
        words = re.split(r"[ \-&]+", name)
        cleaned = [w for w in words if w and w.lower() not in noise]
        return " ".join(cleaned)

    @staticmethod
    def propose_acronym(name: str, word_count_threshold=3):
        words = re.split(r"[ \-&]+", name)
        if len(words) < word_count_threshold:
            return None
        if any(re.fullmatch(r"[A-Z]{2,}", w) for w in words):
            return None
        return "".join(w[0].upper() for w in words if w != "&")

    @classmethod
    def abbreviate(cls, name: str, lang: str = "en", propose_acronym: bool = True):
        if not name:
            return ""

        # 1. Extract parenthesized acronym if valid
        name, existing_acronym = cls.extract_existing_acronym(name)

        # 2. Normalize Unicode and punctuation
        name = cls.normalize_nfd(name)
        name = cls.normalize_punctuation(name)

        # 3. Remove legal suffix
        name = cls.remove_legal_suffix(name, lang)

        # 4. Clean noise words (keep & for counting)
        name = cls.clean_words(name, lang)

        acronym = existing_acronym
        if not acronym and propose_acronym:
            words_for_count = re.split(r"[ \-&]+", name)
            if len(words_for_count) >= 3:
                acronym = cls.propose_acronym(name)

        # 5. Remove & for final output
        name = name.replace("&", "").replace("  ", " ").strip()

        if acronym:
            return f"{name} ({acronym})"
        return name

# -----------------------
# Demo
# -----------------------
if __name__ == "__main__":
    abbr = CompanyAbbrev()
    examples = [
        ("Hewlett-Packard Company, Inc.", "en"),
        ("International Business Machines Corporation", "en"),
        ("Grupo de Industrias Unidas S.A.", "es"),
        ("Société Générale S.A.", "fr"),
        ("Bayerische Motoren Werke AG", "de"),
        ("株式会社トヨタ自動車", "ja"),
        ("有限责任公司中石化", "zh"),
        ("주식회사 삼성전자", "ko"),
        ("ООО Газпром", "ru"),
        ("חברה בעמ אל על", "he"),
        ("شركة الاتصالات السعودية", "ar"),
    ]

    for name, lang in examples:
        result = abbr.abbreviate(name, lang)
        print(f"[{lang}] {name:40} → {result}")
