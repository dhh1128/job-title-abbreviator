import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class OrgAbbrev {

    private static final Map<String, List<String>> LEGAL_SUFFIXES = Map.of(
        "en", Arrays.asList("inc", "llc", "corp", "ltd", "llp", "plc", "corporation", "limited", "company"),
        "fr", Arrays.asList("sa", "sarl", "sas"),
        "es", Arrays.asList("sa", "sl", "sau", "slne"),
        "pt", Arrays.asList("lda", "ltda", "sa", "me"),
        "de", Arrays.asList("gmbh", "ag", "kg", "ug"),
        "it", Arrays.asList("srl", "spa", "snc", "sas"),
        "ru", Arrays.asList("ооо", "зао", "оао", "ao"),
        "zh", Arrays.asList("有限公司", "集团", "公司"),
        "ja", Arrays.asList("株式会社", "有限会社"),
        "ko", Arrays.asList("유한회사", "주식회사"),
        "he", Arrays.asList("בעמ", "חברה בעמ"),
        "ar", Arrays.asList("شذمم", "ش.م.م", "مؤسسة", "شركة")
    );

    private static final Map<String, Set<String>> NOISE_WORDS = Map.of(
        "en", Set.of("the", "of", "and"),
        "fr", Set.of("le", "la", "les", "de", "et"),
        "es", Set.of("el", "la", "los", "de", "y"),
        "pt", Set.of("o", "a", "os", "as", "de", "e"),
        "de", Set.of("der", "die", "das", "und", "von"),
        "it", Set.of("il", "la", "lo", "gli", "dei", "e"),
        "ru", Set.of("и", "из", "в"),
        "zh", Set.of(),
        "ja", Set.of(),
        "ko", Set.of(),
        "he", Set.of("של", "ו"),
        "ar", Set.of("و", "من", "ال")
    );

    private static String normalizeNFD(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD);
    }

    private static String normalizePunctuation(String name) {
        // Keep letters, digits, spaces, &, hyphen
        name = name.replaceAll("[^\\w\\s&-]+", " ");
        name = name.replaceAll("_", " ");
        name = name.replaceAll("\\s+", " ");
        return name.trim();
    }

    private static String removeLegalSuffix(String name, String lang) {
        String normalized = normalizePunctuation(name).toLowerCase();
        List<String> suffixes = LEGAL_SUFFIXES.getOrDefault(lang, Collections.emptyList());
        for (String suffix : suffixes) {
            if (normalized.endsWith(suffix)) {
                name = name.replaceAll("(?i)\\b" + Pattern.quote(suffix) + "$", "").trim();
                break;
            }
        }
        return name;
    }

    private static String cleanWords(String name, String lang) {
        Set<String> noise = NOISE_WORDS.getOrDefault(lang, Collections.emptySet());
        String[] words = name.split("[ \\-&]+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty() && !noise.contains(w.toLowerCase())) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(w);
            }
        }
        return sb.toString();
    }

    private static String proposeAcronym(String name) {
        String[] words = name.split("[ \\-&]+");
        if (words.length < 3) return null;
        for (String w : words) {
            if (w.matches("[A-Z]{2,}")) return null; // already contains acronym
        }
        StringBuilder acronym = new StringBuilder();
        for (String w : words) {
            if (!w.equals("&")) acronym.append(Character.toUpperCase(w.charAt(0)));
        }
        return acronym.toString();
    }

    private static String extractExistingAcronym(String name) {
        Pattern pattern = Pattern.compile("\\(([A-Z]{2,6})\\)\\s*$");
        Matcher matcher = pattern.matcher(name);
        if (matcher.find()) {
            String acronym = matcher.group(1);
            Matcher firstLetter = Pattern.compile("[A-Za-z]").matcher(name);
            if (firstLetter.find() && acronym.charAt(0) == Character.toUpperCase(firstLetter.group().charAt(0))) {
                name = name.replaceAll("\\s*\\([A-Z]{2,6}\\)\\s*$", "").trim();
                return acronym;
            }
        }
        return null;
    }

    public static String abbreviate(String name, String lang, boolean proposeAcronym) {
        if (name == null || name.isEmpty()) return "";

        String existingAcronym = extractExistingAcronym(name);

        name = normalizeNFD(name);
        name = normalizePunctuation(name);
        name = removeLegalSuffix(name, lang);
        name = cleanWords(name, lang);

        String acronym = existingAcronym;
        if (acronym == null && proposeAcronym) {
            String[] wordsForCount = name.split("[ \\-&]+");
            if (wordsForCount.length >= 3) {
                acronym = proposeAcronym(name);
            }
        }

        name = name.replace("&", "").replaceAll("  ", " ").trim();

        if (acronym != null) return name + " (" + acronym + ")";
        return name;
    }

    public static String abbreviate(String name, String lang) {
        return abbreviate(name, lang, true);
    }

    public static String abbreviate(String name) {
        return abbreviate(name, "en", true);
    }

    public static void main(String[] args) {
        System.out.println(abbreviate("Hewlett-Packard Company, Inc."));
        System.out.println(abbreviate("International Business Machines Corporation"));
        System.out.println(abbreviate("Grupo de Industrias Unidas S.A.", "es"));
        System.out.println(abbreviate("Société Générale S.A.", "fr"));
        System.out.println(abbreviate("Bayerische Motoren Werke AG", "de"));
    }
}
