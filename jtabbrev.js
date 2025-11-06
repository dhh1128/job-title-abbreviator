// -------------------------------
// Accent-insensitive helper
// -------------------------------
function nfdBase(str) {
    return str.normalize("NFD").replace(/\p{M}/gu, "");
}

// -------------------------------
// Accent-insensitive replacement
// -------------------------------
function replaceAccentInsensitive(text, pattern, replacement, isCallable = false) {
    const normalized = nfdBase(text);
    const regex = new RegExp(pattern, "gi");
    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(normalized)) !== null) {
        result += text.slice(lastIndex, match.index);
        let repl;
        if (isCallable) {
            const words = text.slice(match.index, regex.lastIndex).split(/\s+/);
            if (words.length >= 3 && words[0].toLowerCase() === "chief" && words[2].toLowerCase() === "officer") {
                repl = "C" + words[1][0].toUpperCase() + words[2][0].toUpperCase() + "O";
            } else if (words.length === 2 && words[0].toLowerCase() === "chief") {
                repl = "C" + words[1][0].toUpperCase() + "O";
            } else {
                repl = text.slice(match.index, regex.lastIndex);
            }
        } else {
            repl = replacement;
        }
        result += repl;
        lastIndex = regex.lastIndex;
    }

    result += text.slice(lastIndex);
    return result;
}

// -------------------------------
// TitleAbbrev class
// -------------------------------
class TitleAbbrev {
    constructor() {
        this.rulesByLang = {};
        this.initRules();
    }

    abbreviate(title, lang = "en") {
        let t = title.trim();
        const tiers = this.rulesByLang[lang] || this.rulesByLang["en"];

        for (const tierName of ["strong", "medium", "weak"]) {
            const rules = tiers[tierName] || [];
            for (const r of rules) {
                t = replaceAccentInsensitive(t, r.pattern, r.replacement, r.isCallable || false);
            }
        }

        return t.replace(/\s{2,}/g, " ").trim();
    }

    initRules() {
        // -------------------------------
        // English
        // -------------------------------
        const enStrong = [
            { pattern: "chief (\\w+) (\\w+) officer", replacement: null, isCallable: true },
            { pattern: "chief (\\w+) officer", replacement: null, isCallable: true },
            { pattern: "executive vice president", replacement: "EVP" },
            { pattern: "senior vice president", replacement: "SVP" },
            { pattern: "vice president", replacement: "VP" },
            { pattern: "president", replacement: "Pres" },
            { pattern: "managing director", replacement: "MD" },
            { pattern: "board chair", replacement: "Chair" },
            { pattern: "member of the board", replacement: "Board Member" },
            { pattern: "general counsel", replacement: "GC" },
            { pattern: "chief counsel", replacement: "CC" },
            { pattern: "chief legal officer", replacement: "CLO" },
        ];

        const enMedium = [
            { pattern: "\\bSenior\\b", replacement: "Sr" },
            { pattern: "\\bJunior\\b", replacement: "Jr" },
            { pattern: "\\bAssistant\\b", replacement: "Asst" },
            { pattern: "\\bAssociate\\b", replacement: "Assoc" },
            { pattern: "\\bManager\\b", replacement: "Mgr" },
            { pattern: "\\bDirector\\b", replacement: "Dir" },
            { pattern: "\\bAdministrator\\b", replacement: "Admin" },
            { pattern: "\\bCoordinator\\b", replacement: "Coord" },
            { pattern: "\\bEngineer\\b", replacement: "Eng" },
            { pattern: "\\bConsultant\\b", replacement: "Cons" },
        ];

        const enWeak = [
            { pattern: "\\b(of|the|for)\\b", replacement: "" }
        ];

        this.rulesByLang["en"] = { strong: enStrong, medium: enMedium, weak: enWeak };

        // -------------------------------
        // Multilingual rules
        // -------------------------------
        const dgRule = [{ pattern: "directeur[ao]? general[e]?", replacement: "DG" }];

        this.rulesByLang["fr"] = { strong: dgRule, medium: [], weak: [] };
        this.rulesByLang["es"] = { strong: dgRule, medium: [], weak: [] };
        this.rulesByLang["it"] = { strong: dgRule, medium: [], weak: [] };
        this.rulesByLang["pt"] = { strong: dgRule, medium: [], weak: [] };
        this.rulesByLang["de"] = { strong: [{ pattern: "geschäftsführer(in)?", replacement: "GF" }], medium: [], weak: [] };
        this.rulesByLang["ru"] = { strong: [{ pattern: "генеральный директор", replacement: "ген. дир." }], medium: [], weak: [] };
        this.rulesByLang["zh"] = { strong: [{ pattern: "总经理", replacement: "GM" }], medium: [], weak: [] };
        this.rulesByLang["ja"] = { strong: [{ pattern: "代表取締役社長", replacement: "社長" }], medium: [], weak: [] };
        this.rulesByLang["ko"] = { strong: [{ pattern: "대표이사", replacement: "대표" }], medium: [], weak: [] };
        this.rulesByLang["he"] = { strong: [{ pattern: "מנהל כללי", replacement: "מנכ\"ל" }], medium: [], weak: [] };
        this.rulesByLang["ar"] = { strong: [{ pattern: "المدير العام", replacement: "م.ع." }], medium: [], weak: [] };
    }
}

// -------------------------------
// Demo
// -------------------------------
const abbrev = new TitleAbbrev();
const examples = [
    ["Chief Financial Officer", "en"],
    ["Senior Vice President of Operations", "en"],
    ["Director of Marketing", "en"],
    ["Directeur Général", "fr"],
    ["Direttore Generale", "it"],
    ["Geschäftsführer", "de"],
    ["генеральный директор", "ru"],
    ["总经理", "zh"],
    ["代表取締役社長", "ja"],
    ["대표이사", "ko"],
    ["מנהל כללי", "he"],
    ["المدير العام", "ar"]
];

examples.forEach(([title, lang]) => {
    console.log(`[${lang}] ${title.padEnd(35)} → ${abbrev.abbreviate(title, lang)}`);
});
