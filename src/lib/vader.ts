// VADER (Valence Aware Dictionary and sEntiment Reasoner) sentiment analyzer.
// TypeScript port of the core VADER algorithm for browser-side analysis.

export type VaderPolarity = 'positive' | 'neutral' | 'negative';

export interface VaderResult {
  polarity: VaderPolarity;
  compound: number;
  positive: number;
  negative: number;
  neutral: number;
  matched: { word: string; score: number }[];
  explanation: string;
}

// VADER lexicon — word → valence score (subset of the full VADER lexicon)
const LEXICON: Record<string, number> = {
  'good': 1.9, 'great': 3.1, 'excellent': 3.4, 'amazing': 3.2, 'awesome': 3.3,
  'fantastic': 3.3, 'wonderful': 3.0, 'love': 3.2, 'loved': 3.2, 'loves': 3.2,
  'perfect': 3.3, 'happy': 2.7, 'best': 3.2, 'brilliant': 3.1, 'superb': 3.3,
  'delighted': 2.9, 'pleased': 2.7, 'satisfied': 2.5, 'recommend': 2.4,
  'recommended': 2.4, 'enjoy': 2.4, 'enjoyed': 2.4, 'enjoyable': 2.5,
  'nice': 2.0, 'pleasant': 2.2, 'impressed': 2.5, 'impressive': 2.6,
  'outstanding': 3.0, 'exceptional': 3.0, 'fabulous': 3.0, 'terrific': 2.9,
  'glad': 2.2, 'thankful': 2.3, 'grateful': 2.5, 'smooth': 1.8,
  'comfortable': 1.8, 'reliable': 2.0, 'durable': 1.7, 'quality': 2.1,
  'beautiful': 2.7, 'gorgeous': 3.0, 'stunning': 3.0, 'elegant': 2.4,
  'fresh': 1.8, 'tasty': 2.5, 'delicious': 3.1, 'yummy': 2.5,
  'fast': 1.6, 'quick': 1.5, 'easy': 1.6, 'helpful': 2.2, 'friendly': 2.3,
  'affordable': 1.8, 'worth': 1.7, 'value': 1.6, 'bonus': 1.5,
  'like': 1.5, 'liked': 1.5, 'fine': 1.3, 'okay': 0.9, 'ok': 0.9,
  'decent': 1.5, 'solid': 1.6, 'cool': 1.5, 'fun': 2.0,
  'exciting': 2.5, 'excited': 2.5, 'thrilled': 3.0, 'cheerful': 2.5,
  'positive': 1.8, 'improve': 1.5, 'improved': 1.5, 'success': 2.2,
  'successful': 2.3, 'bargain': 1.7, 'pristine': 2.3, 'mint': 1.8,
  'incredible': 2.9, 'remarkable': 2.7, 'lovely': 2.6, 'super': 2.5,
  'favorable': 2.0, 'commendable': 2.4, 'magnificent': 3.1, 'splendid': 2.8,
  'marvelous': 2.9, 'phenomenal': 3.0, 'exceeds': 2.0, 'exceeded': 2.0,
  'prompt': 1.7, 'courteous': 2.2, 'attentive': 2.0, 'efficient': 1.9,
  'seamless': 2.0, 'intuitive': 1.8, 'responsive': 1.9, 'diligent': 1.8,
  'passionate': 2.2, 'authentic': 2.0, 'genuine': 1.9, 'honest': 1.8,
  'fair': 1.7, 'generous': 2.1, 'thoughtful': 2.2, 'convenient': 1.8,

  'bad': -2.5, 'terrible': -3.0, 'awful': -3.0, 'horrible': -3.1, 'hate': -2.8,
  'hated': -2.8, 'worst': -3.2, 'poor': -2.5, 'disappointing': -2.7,
  'disappointed': -2.7, 'disappointment': -2.6, 'disgusting': -2.9, 'gross': -2.6,
  'broken': -2.0, 'defective': -2.5, 'faulty': -2.3, 'useless': -2.9,
  'worthless': -2.9, 'waste': -2.5, 'wasted': -2.5, 'slow': -1.5, 'sluggish': -1.7,
  'delay': -1.5, 'delayed': -1.6, 'late': -1.3, 'rude': -2.5, 'unfriendly': -2.5,
  'unhelpful': -2.3, 'expensive': -1.6, 'overpriced': -2.4, 'cheap': -1.8,
  'flimsy': -1.9, 'fragile': -1.8, 'uncomfortable': -2.2, 'noisy': -1.7,
  'dirty': -2.5, 'stale': -2.3, 'bland': -1.8, 'soggy': -1.9, 'cold': -1.0,
  'sour': -1.7, 'bitter': -1.8, 'ugly': -2.3, 'dull': -1.7, 'boring': -1.8,
  'confusing': -1.9, 'confused': -1.8, 'frustrating': -2.3, 'frustrated': -2.3,
  'annoying': -2.2, 'annoyed': -2.2, 'angry': -2.5, 'upset': -2.3, 'sad': -2.0,
  'unhappy': -2.4, 'miserable': -2.9, 'painful': -2.3, 'pain': -1.8,
  'problem': -1.8, 'problems': -1.8, 'issue': -1.6, 'issues': -1.6,
  'fail': -2.3, 'failed': -2.3, 'failure': -2.4, 'crash': -2.3, 'crashed': -2.3,
  'bug': -1.8, 'buggy': -2.3, 'glitch': -1.8, 'glitchy': -2.2, 'error': -1.7,
  'errors': -1.7, 'damage': -2.3, 'damaged': -2.3, 'leak': -1.8, 'leaked': -1.8,
  'stinks': -2.4, 'scam': -3.0, 'fraud': -3.0, 'fake': -2.5, 'misleading': -2.4,
  'refund': -1.5, 'returned': -1.8, 'never': -1.0, 'nothing': -0.8,
  'lacking': -1.8, 'lacks': -1.8, 'missing': -1.7, 'difficult': -1.8,
  'complicated': -1.9, 'messy': -1.9, 'clunky': -1.9, 'outdated': -1.9,
  'regret': -2.4, 'regretted': -2.4, 'warning': -1.8, 'beware': -2.3,
  'avoid': -2.3, 'garbage': -2.9, 'junk': -2.8, 'ripoff': -2.9,
  'horrendous': -3.1, 'atrocious': -3.0, 'dreadful': -2.9, 'abysmal': -3.0,
  'inferior': -2.2, 'shoddy': -2.3, 'subpar': -2.0, 'mediocre': -1.5,
  'unreliable': -2.1, 'unprofessional': -2.4, 'incompetent': -2.5,
  'negligent': -2.3, 'deceptive': -2.6, 'unacceptable': -2.5,
  'displeased': -2.3, 'dissatisfied': -2.4, 'trouble': -1.7, 'troublesome': -1.9,
  'worried': -1.8, 'concerned': -1.6, 'negative': -1.9, 'decline': -1.5,
  'deteriorate': -2.0, 'worse': -2.0, 'downfall': -2.1, 'disaster': -2.7,
};

const NEGATIONS = new Set([
  'not', 'no', 'never', "n't", 'without', 'hardly', 'barely',
  "don't", "doesn't", "didn't", "isn't", "wasn't", "aren't",
  "won't", "can't", "couldn't", "shouldn't", "wouldn't", 'neither', 'nor',
]);

const BOOSTERS: Record<string, number> = {
  'very': 0.293, 'really': 0.293, 'so': 0.293, 'extremely': 0.493,
  'incredibly': 0.493, 'absolutely': 0.293, 'totally': 0.293, 'quite': 0.293,
  'too': 0.293, 'particularly': 0.293, 'especially': 0.293, 'highly': 0.293,
  'super': 0.293, 'truly': 0.293, 'remarkably': 0.493, 'utterly': 0.493,
  'completely': 0.493, 'entirely': 0.493, 'fully': 0.293, 'hugely': 0.493,
  'immensely': 0.493, 'decidedly': 0.293, 'deeply': 0.293, 'greatly': 0.293,
  'intensely': 0.493, 'exceptionally': 0.493, 'seriously': 0.293,
  'terribly': 0.293, 'freaking': 0.293, 'flipping': 0.293,
};

const DAMPENERS: Record<string, number> = {
  'slightly': -0.293, 'somewhat': -0.293, 'kinda': -0.293,
  'rather': -0.293, 'fairly': -0.293, 'barely': -0.586, 'hardly': -0.586,
  'scarcely': -0.586, 'marginally': -0.293, 'moderately': -0.293,
};

const NEGATE = -0.74;

const ALLCAP_RE = /^[A-Z]{2,}$/;
const PUNCT_RE = /[!?.]+/g;

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9'\s]/gi, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
}

function isAllCaps(word: string): boolean {
  return ALLCAP_RE.test(word) && word.length > 1;
}

function punctuationEmphasis(text: string): number {
  const exclaims = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  let emphasis = 0;
  if (exclaims > 0) emphasis += Math.min(exclaims, 4) * 0.29;
  if (questions > 1) emphasis += (questions > 1 ? 0.18 : 0);
  return emphasis;
}

export function analyzeVader(text: string): VaderResult {
  const rawTokens = text.split(/\s+/).filter(Boolean);
  const lowerTokens = tokenize(text);
  const matched: { word: string; score: number }[] = [];

  let sentimentTotal = 0;
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  let sentimentWords = 0;

  for (let i = 0; i < lowerTokens.length; i++) {
    const token = lowerTokens[i];
    let valence = LEXICON[token];

    if (valence === undefined) continue;

    const rawWord = rawTokens[i] ?? token;
    const prev = lowerTokens[i - 1] ?? '';
    const prev2 = lowerTokens[i - 2] ?? '';
    const prev3 = lowerTokens[i - 3] ?? '';

    // All-caps boost
    if (isAllCaps(rawWord)) {
      valence += valence > 0 ? 0.733 : -0.733;
    }

    // Negation check (look back up to 3 tokens)
    if (NEGATIONS.has(prev) || NEGATIONS.has(prev2) || NEGATIONS.has(prev3)) {
      valence *= NEGATE;
    } else {
      // Booster / dampener
      if (BOOSTERS[prev] !== undefined) valence += valence * BOOSTERS[prev];
      else if (DAMPENERS[prev] !== undefined) valence += valence * DAMPENERS[prev];
      if (BOOSTERS[prev2] !== undefined) valence += valence * (BOOSTERS[prev2] / 2);
      else if (DAMPENERS[prev2] !== undefined) valence += valence * (DAMPENERS[prev2] / 2);
    }

    // "but" handling — reduce valence of words before "but"
    for (let j = i + 1; j < Math.min(i + 4, lowerTokens.length); j++) {
      if (lowerTokens[j] === 'but' || lowerTokens[j] === 'however') {
        valence *= 0.5;
        break;
      }
    }

    sentimentTotal += valence;
    sentimentWords++;

    if (valence > 0) positiveScore += valence;
    else if (valence < 0) negativeScore += -valence;
    else neutralScore += 1;

    matched.push({ word: token, score: Math.round(valence * 100) / 100 });
  }

  // Punctuation emphasis
  const punctBoost = punctuationEmphasis(text);
  if (sentimentTotal > 0) sentimentTotal += punctBoost;
  else if (sentimentTotal < 0) sentimentTotal -= punctBoost;

  // Normalize: compound score (VADER's sigmoid normalization)
  const compound = Math.max(-1, Math.min(1, sentimentTotal / Math.sqrt(sentimentTotal * sentimentTotal + 15)));

  // Proportions
  const sum = positiveScore + negativeScore + neutralScore || 1;
  const posProp = positiveScore / sum;
  const negProp = negativeScore / sum;
  const neuProp = neutralScore / sum;

  let polarity: VaderPolarity;
  if (compound >= 0.05) polarity = 'positive';
  else if (compound <= -0.05) polarity = 'negative';
  else polarity = 'neutral';

  const explanation = buildVaderExplanation(polarity, compound, matched, sentimentWords);

  return {
    polarity,
    compound: Math.round(compound * 1000) / 1000,
    positive: Math.round(posProp * 1000) / 1000,
    negative: Math.round(negProp * 1000) / 1000,
    neutral: Math.round(neuProp * 1000) / 1000,
    matched,
    explanation,
  };
}

function buildVaderExplanation(
  polarity: VaderPolarity,
  compound: number,
  matched: { word: string; score: number }[],
  sentimentWords: number,
): string {
  if (sentimentWords === 0) {
    return 'No sentiment-bearing words were found in the text. VADER classifies this as neutral — the content appears to be purely descriptive or factual.';
  }

  const top = [...matched].sort((a, b) => Math.abs(b.score) - Math.abs(a.score)).slice(0, 5);
  const wordList = top.map((m) => `"${m.word}" (${m.score > 0 ? '+' : ''}${m.score})`).join(', ');

  const strength =
    Math.abs(compound) > 0.6 ? 'strongly' : Math.abs(compound) > 0.3 ? 'moderately' : 'mildly';

  const label =
    polarity === 'positive' ? 'positive' : polarity === 'negative' ? 'negative' : 'neutral';

  let base: string;
  if (polarity === 'neutral') {
    base = `The text reads as neutral. VADER found sentiment words (${wordList}) but their combined score (compound: ${compound.toFixed(3)}) falls within the neutral range (between -0.05 and +0.05).`;
  } else {
    base = `The text ${strength} leans ${label}. VADER detected key sentiment words: ${wordList}. The compound score of ${compound.toFixed(3)} places this firmly in the ${label} range.`;
  }

  return base;
}
