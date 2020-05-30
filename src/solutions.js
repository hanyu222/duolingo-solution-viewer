import XRegExp from 'xregexp';
import lodash from 'lodash';
import moize from 'moize';
import { List, Map } from 'immutable';
import { _, it, lift } from 'param.macro';
import { mergeMapsWith, newMapWith } from './functions';
import { SENTENCE_WORDS_REGEXP, TRIMMED_WORDS_REGEXP } from './constants';

/**
 * A single vertex from a solution graph.
 * @typedef {Object} Vertex
 * @property {?number} to The index of the next vertex, if there is any.
 * @property {string} lenient The reference value of the vertex.
 * @property {?string} orig The original value of the vertex (if different from its lenient value).
 * @property {?boolean} auto Whether the vertex was automatically derived.
 * @property {?string} type The type of the vertex, only used for particular cases.
 */

/**
 * A single choice from a solution token.
 * @typedef {Object} TokenValue
 * @property {boolean} isAutomatic Whether the token value was automatically derived from another value.
 * @property {string} value The actual value.
 */

/**
 * A single element from a solution.
 * A token can hold multiple values, in which case each represents a possible choice.
 * @typedef {TokenValue[]} Token
 */

/**
 * A possible solution to a challenge.
 * @typedef {Object} Solution
 * @property {string} locale The tag of the language in which the solution is written.
 * @property {string} reference The reference sentence of the solution, usable e.g. for sorting.
 * @property {List<Token>} tokens The list of tokens building up all the possible sentences of the solution.
 * @property {boolean} hasAutomatic Whether the solution contains at least one token with one automatic value.
 * @property {boolean} isAutomatic Whether the solution contains at least one token with only automatic values.
 * @property {boolean} isComplex Whether the solution contains at least one token with multiple values.
 * @property {?number} score The similarity score of the solution (only when matched against an answer).
 */

/**
 * A set of statistics about one or more words, used for similarity matching.
 * @typedef {Object} MatchingData
 * @property {number} charCount The total number of characters across the matched words.
 * @property {number} wordCount The total number of matched words.
 * @property {Map} bigramMap A map from bigrams to their number of occurrences in the matched words.
 */

/**
 * Compares two strings using a pre-defined set of collation rules.
 * @param {string} x
 * @param {string} y
 * @param {string} locale
 * @returns {number}
 */
function compareStrings(x, y, locale) {
  return x.localeCompare(y, locale, {
    ignorePunctuation: true,
    numeric: true,
    sensitivity: 'accent',
    usage: 'sort'
  });
}

/**
 * Checks whether two vertex values are relevantly different (meaning whether both can/should be displayed to the user).
 * @param {string} x
 * @param {string} y
 * @param {string} locale
 * @returns {boolean}
 */
function hasVertexRelevantDifferences(x, y, locale) {
  x = x.toLocaleLowerCase(locale);
  y = y.toLocaleLowerCase(locale);

  if (x !== y) {
    x = (XRegExp.exec(x, TRIMMED_WORDS_REGEXP) || [ '' ])[0];
    y = (XRegExp.exec(y, TRIMMED_WORDS_REGEXP) || [ '' ])[0];
    return (x !== y);
  }

  return false;
}

/**
 * Returns the token values corresponding to a vertex taken from a solution graph.
 * @param {Vertex} vertex
 * @param {string} locale
 * @returns {TokenValue[]}
 */
function getVertexTokenValues(vertex, locale) {
  const isAutomatic = !!vertex.auto;

  if (
    lodash.isString(vertex.orig)
    && lodash.isString(vertex.lenient)
    && hasVertexRelevantDifferences(vertex.lenient, vertex.orig, locale)
  ) {
    return [
      {
        isAutomatic,
        value: vertex.orig,
      },
      {
        isAutomatic: true,
        value: vertex.lenient,
      }
    ];
  }

  return [
    {
      isAutomatic,
      value: String(vertex.orig || vertex.lenient || ''),
    }
  ];
}

/**
 * Compares two token values by relevance.
 * @param {TokenValue} x
 * @param {TokenValue} y
 * @param {string} locale
 * @returns {number}
 */
function compareTokenValues(x, y, locale) {
  const result = compareStrings(x.value, y.value, locale);
  return (0 !== result) ? result : (x.isAutomatic - y.isAutomatic);
}

/**
 * Parses a list of vertices taken from a solution graph and corresponding to a single token.
 * Returns the parsed token, and the corresponding solution values.
 * @param {Vertex[]} vertices
 * @param {string} locale
 * @returns {{hasAutomatic: boolean, isAutomatic: boolean, isComplex: boolean, reference: string, token: Token}}
 */
function parseTokenVertices(vertices, locale) {
  let hasAutomatic;
  let isAutomatic;
  let isComplex;
  let reference;

  let values = Array.from(vertices).flatMap(getVertexTokenValues(_, locale));

  if (values.length > 1) {
    hasAutomatic = values.some(it.isAutomatic);
    isAutomatic = hasAutomatic && values.every(it.isAutomatic);
    isComplex = true;
    values = lodash.sortedUniqBy(values.sort(compareTokenValues(_, _, locale)), it.value);
    reference = (hasAutomatic && values.find(!it.isAutomatic) || values[0]).value;
  } else {
    hasAutomatic = !!values[0].isAutomatic;
    isAutomatic = hasAutomatic;
    isComplex = false;
    reference = values[0].value;
  }

  return {
    hasAutomatic,
    isAutomatic,
    isComplex,
    reference,
    token: values
  };
}

/**
 * Initializes a solution from a list of vertices taken from a solution graph and corresponding to a single token.
 * @param {Vertex[]} vertices
 * @param {string} locale
 * @returns {Solution}
 */
function fromTokenVertices(vertices, locale) {
  const { token, ...result } = parseTokenVertices(vertices, locale);
  result.locale = locale;
  result.tokens = List.of(token);
  return result;
}

/**
 * Prepends to an existing solution a list of vertices taken from a solution graph and corresponding to a single token.
 * Returns a new solution.
 * @param {Vertex[]} vertices
 * @param {Solution} solution
 * @returns {Solution}
 */
function prependTokenVertices(vertices, solution) {
  const { token, ...result } = parseTokenVertices(vertices, solution.locale);
  result.hasAutomatic = result.hasAutomatic || solution.hasAutomatic;
  result.isAutomatic = result.isAutomatic || solution.isAutomatic;
  result.isComplex = result.isComplex || solution.isComplex;
  result.reference = result.reference + solution.reference;
  result.tokens = solution.tokens.unshift(token);
  result.locale = solution.locale;
  return result;
}

/**
 * Builds a list of all possible (sub) solutions that start from a given index, based on a flattened list of vertices
 * taken from a solution graph, with vertices been grouped by their next index.
 * @param {Array.<Object.<number, Vertex[]>>} groupedVertices
 * @param {number} startIndex
 * @param {string} locale
 * @returns {Solution[]}
 */
function fromGroupedVertices(groupedVertices, startIndex, locale) {
  if (
    !groupedVertices[startIndex]
    || !lodash.isPlainObject(groupedVertices[startIndex])
    || lodash.isEmpty(groupedVertices[startIndex])
  ) {
    return [];
  }

  return Object.entries(groupedVertices[startIndex])
    .flatMap(([ key, group ]) => {
      const index = Number(key);
      const subSolutions = fromGroupedVertices(groupedVertices, index, locale);

      return (subSolutions.length > 0)
        ? subSolutions.map(lift(prependTokenVertices(group, _)))
        : ((index !== groupedVertices.length - 1) ? [] : fromTokenVertices(group, locale));
    });
}

/**
 * Returns whether a vertex is relevant and should be displayed to the user.
 * @param {Vertex} vertex
 * @param {boolean} allowAutomatic
 * @return {boolean}
 */
function isRelevantVertex(vertex, allowAutomatic) {
  return ('typo' !== vertex.type) && (allowAutomatic || !vertex.auto);
}

/**
 * Builds a list of all the possible solutions based on a flattened list of vertices taken from a solution graph.
 * @param {Vertex[][]} vertices
 * @param {boolean} includeAutomatic
 * @param {string} locale
 * @returns {Solution[]}
 */
export function fromVertices(vertices, includeAutomatic, locale) {
  return fromGroupedVertices(vertices.map(
    lodash.groupBy(
      _.filter(isRelevantVertex(_, includeAutomatic)),
      it.to
    )
  ), 0, locale);
}

/**
 * Builds a list of all the possible solutions based on a list of correct naming solutions.
 * @param {string[]} solutions
 * @param {string} locale
 * @returns {Solution[]}
 */
export function fromNamingSolutions(solutions, locale) {
  return solutions
    .filter(lodash.isString)
    .map(solution => {
      const reference = solution.normalize().trim();

      const tokens = reference
        .split(SENTENCE_WORDS_REGEXP)
        .map(value => [ { value, isAutomatic: false } ]);

      return {
        locale,
        reference,
        tokens: List(tokens),
        hasAutomatic: false,
        isAutomatic: false,
        isComplex: false,
      };
    });
}

/**
 * Builds a list of all the possible solutions based on a list of correct tokens from a word bank.
 * @param {string[]} wordTokens
 * @param {string} locale
 * @returns {Solution[]}
 */
export function fromWordBankTokens(wordTokens, locale) {
  const words = wordTokens
    .filter(lodash.isString)
    .map(token => token.normalize());

  const reference = words.join(' ').trim();

  if ('' !== reference) {
    const spaceToken = [ { value: ' ', isAutomatic: false } ];
    const tokens = words.map(value => [ { value, isAutomatic: false } ]);

    return [ {
      locale,
      reference,
      tokens: List(tokens).interpose(spaceToken),
      hasAutomatic: false,
      isAutomatic: false,
      isComplex: false,
    } ];
  }

  return [];
}

/**
 * Returns a user-friendly string summarizing a solution.
 * @param {Solution} solution
 * @param {boolean} includeAutomatic
 * @returns {string}
 */
export function toDisplayableString(solution, includeAutomatic) {
  return solution.tokens.reduce((result, token) => {
    const choices = includeAutomatic ? token : token.filter(!it.isAutomatic);

    const choice = (1 === choices.length)
      ? choices[0].value
      : ('[' + choices.map(it.value).join(' / ') + ']');

    return result + choice;
  }, '');
}

/**
 * Compares two solutions by their reference sentence.
 * @param {Solution} x
 * @param {Solution} y
 * @returns {number}
 */
export function compareValues(x, y) {
  let result = compareStrings(x.reference, y.reference, x.locale);

  if (0 === result) {
    result = x.isAutomatic - y.isAutomatic;

    if (0 === result) {
      result = x.isComplex - y.isComplex;
    }
  }

  return result;
}

/**
 * Compares two solutions by their similarity scores.
 * @param {Solution} x
 * @param {Solution} y
 * @returns {number}
 */
export function compareScores(x, y) {
  const result = (y.score || 0) - (x.score || 0);
  return (0 !== result) ? result : compareValues(x, y);
}

/**
 * Returns i18n-related counts for a list of solutions.
 * @param {Solution[]} solutions
 * @returns {{display: string, plural: number}}
 */
export function getI18nCounts(solutions) {
  let plural = solutions.length;
  let display = plural.toString();

  if (solutions.some(!!it.isComplex)) {
    ++plural;
    display += '+';
  }

  return { display, plural };
}

/**
 * Returns whether a token is empty.
 * @param {Token} token
 * @returns {boolean}
 */
function isEmptyToken(token) {
  return (1 === token.length) && ('' === token[0].value.trim());
}

/**
 * Adds the bigrams of a word to a map from bigrams to number of occurrences.
 * @param {Map} map
 * @param {string} word
 * @returns {Map}
 */
function addWordBigramsToMap(map, word) {
  if (1 === word.length) {
    return map.set(word, (map.get(word) || 0) + 1);
  }

  for (let i = 0, l = word.length - 1; i < l; i++) {
    const bigram = word.substring(i, i + 2);
    map.set(bigram, (map.get(bigram) || 0) + 1);
  }

  return map;
}

/**
 * @type {MatchingData}
 */
const emptyMatchingData = {
  charCount: 0,
  wordCount: 0,
  bigramMap: Map(),
};

/**
 * Returns the similarity matching data for a string.
 * @function
 * @param {string} string
 * @param {string} locale
 * @returns {MatchingData}
 */
const getStringMatchingData = moize(
  (string, locale) => {
    const words = string.trim()
      .normalize()
      .toLocaleLowerCase(locale)
      .match(SENTENCE_WORDS_REGEXP);

    return (null === words)
      ? emptyMatchingData
      : {
        charCount: lodash.sumBy(words, it.length),
        wordCount: words.length,
        bigramMap: newMapWith(map => words.reduce(addWordBigramsToMap(_, _), map)),
      };
  }
);

/**
 * Merges together a list of similarity matching data.
 * @param {MatchingData[]} data
 * @returns {MatchingData}
 */
function mergeMatchingData(data) {
  return (0 === data.length)
    ? emptyMatchingData
    : {
      charCount: lodash.sumBy(data, it.charCount),
      wordCount: lodash.sumBy(data, it.wordCount),
      bigramMap: mergeMapsWith(lodash.add, ...data.map(it.bigramMap)),
    };
}

/**
 * The (unique) key under which similarity matching data is consolidated in a solution.
 * @type {symbol}
 */
const MATCHING_DATA = Symbol('matching_data');

/**
 * Returns the similarity matching data for a solution, split into:
 * - "shared": the matching data for the words shared by all the possible sentences,
 * - "paths":  for each possible sentence, the matching data for their exclusive words.
 * @param {Solution} solution
 * @returns {{ shared: MatchingData, paths: MatchingData }}
 */
function getSolutionMatchingData(solution) {
  if (!solution[MATCHING_DATA]) {
    const tokenGroups = lodash.groupBy(
      solution.tokens.toArray().filter(!isEmptyToken(_)),
      token => token.length > 1
    );

    solution[MATCHING_DATA] = {};
    const locale = solution.locale;

    solution[MATCHING_DATA]['shared'] = mergeMatchingData(
      (tokenGroups['false'] || []).map(getStringMatchingData(_[0].value, locale))
    );

    const choicesMatchingData = (tokenGroups['true'] || []).map(it.map(getStringMatchingData(_.value, locale)));

    if (choicesMatchingData.length > 0) {
      const pathsMatchingData = lodash.product.apply(null, choicesMatchingData);
      solution[MATCHING_DATA]['paths'] = pathsMatchingData.map(mergeMatchingData);
    }
  }

  return solution[MATCHING_DATA];
}

/**
 * Returns the similarity score between a solution and a user answer (ranging from 0 to 1).
 * @param {Solution} solution
 * @param {string} answer
 * @returns {number}
 */
export function matchAgainstAnswer(solution, answer) {
  const solutionMatchingData = getSolutionMatchingData(solution);

  const locale = solution.locale;
  const answerMatchingData = getStringMatchingData(answer, locale);

  const sharedCharCount
    = answerMatchingData.charCount
    + solutionMatchingData.shared.charCount;

  const sharedWordCount
    = answerMatchingData.wordCount
    + solutionMatchingData.shared.wordCount;

  let sharedIntersectionSize = 0;

  const answerBigramMap = answerMatchingData.bigramMap.map((answerCount, bigram) => {
    const solutionCount = solutionMatchingData.shared.bigramMap.get(bigram) || 0;

    if (solutionCount > 0) {
      sharedIntersectionSize += Math.min(answerCount, solutionCount);
      return Math.max(0, answerCount - solutionCount);
    }

    return answerCount;
  });

  if (!solutionMatchingData['paths']) {
    return 2.0 * sharedIntersectionSize / (sharedCharCount - sharedWordCount);
  }

  const scores = solutionMatchingData['paths'].map(pathMatchingData => {
    const pathIntersectionSize = answerBigramMap.reduce(
      (size, answerCount, bigram) => size + Math.min(answerCount, pathMatchingData.bigramMap.get(bigram) || 0),
      0
    );

    const totalCharCount = sharedCharCount + pathMatchingData.charCount;
    const totalWordCount = sharedWordCount + pathMatchingData.wordCount;

    return 2.0 * (sharedIntersectionSize + pathIntersectionSize) / (totalCharCount - totalWordCount);
  });

  return Math.max.apply(null, scores);
}
