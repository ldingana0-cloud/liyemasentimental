// Lexicon-based sentiment analyzer.
// Scores text by summing word weights from a curated lexicon,
// then classifies as positive / neutral / negative and explains the call.

type Polarity = 'positive' | 'neutral' | 'negative';

interface ScoredWord {
  word: string;
  weight: number;
}

export interface SentimentResult {
  polarity: Polarity;
  score: number;
  comparative: number;
  matched: ScoredWord[];
  explanation: string;
}

const POSITIVE = new Map<string, number>([
  ['good', 3], ['great', 3], ['excellent', 4], ['amazing', 4], ['awesome', 4],
  ['fantastic', 4], ['wonderful', 4], ['love', 3], ['loved', 3], ['loves', 3],
  ['perfect', 4], ['happy', 3], ['best', 4], ['brilliant', 4], ['superb', 4],
  ['delighted', 3], ['pleased', 3], ['satisfied', 3], ['recommend', 3],
  ['recommended', 3], ['enjoy', 3], ['enjoyed', 3], ['enjoyable', 3],
  ['nice', 2], ['pleasant', 2], ['impressed', 3], ['impressive', 3],
  ['outstanding', 4], ['exceptional', 4], ['fabulous', 4], ['terrific', 3],
  ['glad', 2], ['thankful', 3], ['grateful', 3], ['smooth', 2],
  ['comfortable', 2], ['reliable', 3], ['durable', 2], ['quality', 3],
  ['beautiful', 3], ['gorgeous', 4], ['stunning', 4], ['elegant', 3],
  ['fresh', 2], ['tasty', 3], ['delicious', 4], ['yummy', 3],
  ['fast', 2], ['quick', 2], ['easy', 2], ['helpful', 3], ['friendly', 3],
  ['affordable', 2], ['worth', 2], ['value', 2], ['bonus', 2],
  ['like', 1], ['liked', 1], ['likes', 1], ['fine', 1], ['okay', 1],
  ['ok', 1], ['decent', 2], ['solid', 2], ['cool', 2], ['fun', 2],
  ['exciting', 3], ['excited', 3], ['thrilled', 4], ['cheerful', 3],
  ['positive', 2], ['improve', 2], ['improved', 2], ['improvement', 2],
  ['gain', 2], ['gained', 2], ['win', 2], ['won', 2], ['success', 3],
  ['successful', 3], ['bargain', 2], ['mint', 2], ['pristine', 3],
]);

const NEGATIVE = new Map<string, number>([
  ['bad', -3], ['terrible', -4], ['awful', -4], ['horrible', -4], ['hate', -3],
  ['hated', -3], ['hates', -3], ['worst', -4], ['poor', -3], ['disappointing', -3],
  ['disappointed', -3], ['disappointment', -3], ['disgusting', -4], ['gross', -3],
  ['broken', -3], ['defective', -3], ['faulty', -3], ['useless', -4],
  ['worthless', -4], ['waste', -3], ['wasted', -3], ['slow', -2], ['sluggish', -2],
  ['delay', -2], ['delayed', -2], ['late', -2], ['rude', -3], ['unfriendly', -3],
  ['unhelpful', -3], ['expensive', -2], ['overpriced', -3], ['cheap', -2],
  ['flimsy', -2], ['fragile', -2], ['uncomfortable', -3], ['noisy', -2],
  ['dirty', -3], ['stale', -3], ['bland', -2], ['soggy', -2], ['cold', -1],
  ['sour', -2], ['bitter', -2], ['ugly', -3], ['dull', -2], ['boring', -2],
  ['confusing', -2], ['confused', -2], ['frustrating', -3], ['frustrated', -3],
  ['annoying', -3], ['annoyed', -3], ['angry', -3], ['upset', -3], ['sad', -2],
  ['unhappy', -3], ['miserable', -4], ['painful', -3], ['pain', -2],
  ['problem', -2], ['problems', -2], ['issue', -2], ['issues', -2],
  ['fail', -3], ['failed', -3], ['failure', -3], ['crash', -3], ['crashed', -3],
  ['bug', -2], ['buggy', -3], ['glitch', -2], ['glitchy', -3], ['error', -2],
  ['errors', -2], ['damage', -3], ['damaged', -3], ['leak', -2], ['leaked', -2],
  ['smell', -2], ['stinks', -3], ['stank', -3], ['scam', -4], ['fraud', -4],
  ['fake', -3], ['misleading', -3], ['refund', -2], ['return', -1],
  ['returned', -2], ['never', -1], ['nothing', -1], ['lacking', -2],
  ['lacks', -2], ['missing', -2], ['difficult', -2], ['hard', -1],
  ['complicated', -2], ['messy', -2], ['clunky', -2], ['outdated', -2],
  ['obsolete', -2], ['regret', -3], ['regretted', -3], ['warning', -2],
  ['beware', -3], ['avoid', -3], ['garbage', -4], ['junk', -4], ['ripoff', -4],
]);

// Negations flip the polarity of the word that follows them.
const NEGATORS = new Set(['not', 'no', 'never', "n't", 'without', 'hardly', 'barely', "don't", "doesn't", "didn't", "isn't", "wasn't", "aren't", "won't", "can't", "couldn't", "shouldn't", "wouldn't"]);

// Intensifiers amplify the following word's weight.
const INTENSIFIERS = new Map<string, number>([
  ['very', 1.5], ['really', 1.4], ['so', 1.3], ['extremely', 1.8],
  ['incredibly', 1.7], ['absolutely', 1.6], ['totally', 1.5], ['quite', 1.3],
  ['too', 1.3], ['particularly', 1.4], ['especially', 1.4], ['highly', 1.5],
  ['super', 1.5], ['truly', 1.4], ['remarkably', 1.6], ['utterly', 1.8],
]);

// Diminishers soften the following word's weight.
const DIMINISHERS = new Map<string, number>([
  ['slightly', 0.6], ['somewhat', 0.7], ['kinda', 0.7], ['kind of', 0.7],
  ['sort of', 0.7], ['a bit', 0.7], ['rather', 0.8], ['fairly', 0.8],
  ['barely', 0.4], ['hardly', 0.4],
]);

const PUNCT_OR_NONWORD = /[^a-z0-9'\s]/gi;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(PUNCT_OR_NONWORD, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export function analyzeSentiment(text: string): SentimentResult {
  const tokens = tokenize(text);
  const matched: ScoredWord[] = [];
  let score = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let weight = POSITIVE.get(token) ?? NEGATIVE.get(token);

    if (weight === undefined) continue;

    // Look back up to two tokens for modifiers.
    const prev = tokens[i - 1] ?? '';
    const prev2 = tokens[i - 2] ?? '';

    let multiplier = 1;
    let negated = false;

    if (NEGATORS.has(prev) || NEGATORS.has(prev2)) {
      negated = true;
      weight = -weight * 0.75; // negation flips and slightly dampens
    } else {
      if (INTENSIFIERS.has(prev)) multiplier = INTENSIFIERS.get(prev)!;
      else if (DIMINISHERS.has(prev)) multiplier = DIMINISHERS.get(prev)!;
      else if (INTENSIFIERS.has(prev2)) multiplier = INTENSIFIERS.get(prev2)!;
      weight = weight * multiplier;
    }

    score += weight;
    matched.push({ word: token, weight: Math.round(weight * 100) / 100 });
  }

  const wordCount = tokens.length || 1;
  const comparative = score / wordCount;

  let polarity: Polarity;
  if (score >= 2) polarity = 'positive';
  else if (score <= -2) polarity = 'negative';
  else polarity = 'neutral';

  const explanation = buildExplanation(polarity, score, comparative, matched, negatedPresent(tokens));

  return { polarity, score, comparative, matched, explanation };
}

function negatedPresent(tokens: string[]): boolean {
  return tokens.some((t) => NEGATORS.has(t));
}

function buildExplanation(
  polarity: Polarity,
  score: number,
  comparative: number,
  matched: ScoredWord[],
  hasNegation: boolean,
): string {
  if (matched.length === 0) {
    return 'No strong sentiment-bearing words were found, so the review reads as neutral. It may be purely descriptive or factual.';
  }

  const top = [...matched].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 4);
  const wordList = top.map((m) => `"${m.word}"`).join(', ');

  const direction =
    polarity === 'positive'
      ? 'lean positive'
      : polarity === 'negative'
        ? 'lean negative'
        : 'balance out to neutral';

  const negationNote = hasNegation
    ? ' Negation words (like "not" or "never") were detected and flipped the meaning of nearby sentiment words.'
    : '';

  const strength =
    Math.abs(comparative) > 0.4
      ? 'strongly'
      : Math.abs(comparative) > 0.15
        ? 'moderately'
        : 'mildly';

  const polarityWord =
    polarity === 'positive' ? 'positive' : polarity === 'negative' ? 'negative' : 'neutral';

  return `The review ${strength} ${polarityWord === 'neutral' ? 'reads as neutral' : `leans ${polarityWord}`}. Key sentiment words detected: ${wordList}. Their combined weight (score ${score > 0 ? '+' : ''}${score.toFixed(1)}) caused the review to ${direction}.${negationNote}`;
}
