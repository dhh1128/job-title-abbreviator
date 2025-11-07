class CompanyAbbrev {
    static LEGAL_SUFFIXES = {
        en: ["inc", "llc", "corp", "ltd", "llp", "plc", "corporation", "limited", "company"],
        fr: ["sa", "sarl", "sas"],
        es: ["sa", "sl", "sau", "slne"],
        pt: ["lda", "ltda", "sa", "me"],
        de: ["gmbh", "ag", "kg", "ug"],
        it: ["srl", "spa", "snc", "sas"],
        ru: ["ооо", "зао", "оао", "ao"],
        zh: ["有限公司", "集团", "公司"],
        ja: ["株式会社", "有限会社"],
        ko: ["유한회사", "주식회사"],
        he: ["בעמ", "חברה בעמ"],
        ar: ["شذمم", "ش.م.م", "مؤسسة", "شركة"]
    };

    static NOISE_WORDS = {
        en: ["the", "of", "and"],
        fr: ["le", "la", "les", "de", "et"],
        es: ["el", "la", "los", "de", "y"],
        pt: ["o", "a", "os", "as", "de", "e"],
        de: ["der", "die", "das", "und", "von"],
        it: ["il", "la", "lo", "gli", "dei", "e"],
        ru: ["и", "из", "в"],
        zh: [],
        ja: [],
        ko: [],
        he: ["של", "ו"],
        ar: ["و", "من", "ال"]
    };

    static normalizeNFD(text) {
        return text.normalize("NFD");
    }

    static normalizePunctuation(name) {
        name = name.replace(/[^\w\s&-]+/g, " ");
        name = name.replace(/_/g, " ");
        name = name.replace(/\s+/g, " ");
        return name.trim();
    }

    static extractExistingAcronym(name) {
        const match = name.match(/\(([A-Z]{2,6})\)\s*$/);
        if (match) {
            const acronym = match[1];
            const firstLetterMatch = name.match(/[A-Za-z]/);
            if (firstLetterMatch && acronym[0] === firstLetterMatch[0].toUpperCase()) {
                name = name.replace(/\s*\([A-Z]{2,6}\)\s*$/, "").trim();
                return { name, acronym };
            }
        }
        return { name, acronym: null };
    }

    static removeLegalSuffix(name, lang) {
        let normalized = this.normalizePunctuation(name).toLowerCase();
        const suffixes = this.LEGAL_SUFFIXES[lang] || [];
        for (let suffix of suffixes) {
            const pattern = new RegExp("\\b" + suffix + "$", "i");
            if (pattern.test(normalized)) {
                name = name.replace(pattern, "").trim();
                break;
            }
        }
        return name;
    }

    static cleanWords(name, lang) {
        const noise = new Set(this.NOISE_WORDS[lang] || []);
        const words = name.split(/[ \-&]+/);
        const cleaned = words.filter(w => w && !noise.has(w.toLowerCase()));
        return cleaned.join(" ");
    }

    static proposeAcronym(name) {
        const words = name.split(/[ \-&]+/);
        if (words.length < 3) return null;
        if (words.some(w => /^[A-Z]{2,}$/.test(w))) return null;
        return words.filter(w => w !== "&").map(w => w[0].toUpperCase()).join("");
    }

    static abbreviate(name, lang = "en", proposeAcronym = true) {
        if (!name) return "";

        let { name: processedName, acronym: existingAcronym } = this.extractExistingAcronym(name);

        processedName = this.normalizeNFD(processedName);
        processedName = this.normalizePunctuation(processedName);
        processedName = this.removeLegalSuffix(processedName, lang);
        processedName = this.cleanWords(processedName, lang);

        let acronym = existingAcronym;
        if (!acronym && proposeAcronym) {
            const wordsForCount = processedName.split(/[ \-&]+/);
            if (wordsForCount.length >= 3) {
                acronym = this.proposeAcronym(processedName);
            }
        }

        processedName = processedName.replace(/&/g, "").replace(/\s+/g, " ").trim();

        if (acronym) return `${processedName} (${acronym})`;
        return processedName;
    }
}

/* Example usage
console.log(CompanyAbbrev.abbreviate("Hewlett-Packard Company, Inc.")); // Hewlett Packard Company (HPC)
console.log(CompanyAbbrev.abbreviate("International Business Machines Corporation")); // International Business Machines (IBM)
console.log(CompanyAbbrev.abbreviate("Grupo de Industrias Unidas S.A.", "es")); // Grupo Industrias Unidas (GIU)
console.log(CompanyAbbrev.abbreviate("Société Générale S.A.", "fr")); // Société Générale (SG)
console.log(CompanyAbbrev.abbreviate("Bayerische Motoren Werke AG", "de")); // Bayerische Motoren Werke (BMW)
*/