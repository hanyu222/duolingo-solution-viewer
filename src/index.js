import { h, render } from 'preact';
import { IntlProvider } from 'preact-i18n';
import lodash from 'lodash';
import { _, it } from 'param.macro';
import ClosestSolution from './components/ClosestSolution';
import SolutionListLink from './components/SolutionListLink';
import SolutionListModal from './components/SolutionListModal';

import {
  EXTENSION_PREFIX,
  LISTENING_CHALLENGE_TYPES,
  NAMING_CHALLENGE_TYPES,
  RESULT_CORRECT,
  RESULT_INCORRECT,
  TRANSLATION_CHALLENGE_TYPES,
  WORD_BANK_CHALLENGE_TYPES,
} from './constants';

import * as solution from './solutions';
import { discardEvent, getUiLocale, getUniqueElementId, logError } from './functions';
import { getTranslations } from './translations';

/**
 * A translation challenge.
 * @typedef {Object} Challenge
 * @property {string} statement The sentence to translate.
 * @property {Solution[]} solutions The accepted translations.
 * @property {boolean} isNamingChallenge Whether the challenge is a naming challenge.
 */

/**
 * The translation challenges of the current practice session, arranged by statements.
 * @type {Object.<string, Challenge>}
 */
let currentTranslationChallenges = {};

/**
 * The naming challenges of the current practice session, arranged by statements.
 * @type {Object.<string, Challenge>}
 */
let currentNamingChallenges = {};

/**
 * The listening challenges of the current practice session, arranged by translations.
 * @type {Object.<string, Challenge>}
 */
let currentListeningChallenges = {};

/**
 * Returns the list of solutions for a challenge.
 * @param {Object} challenge
 * @returns {Solution[]}
 */
function getChallengeSolutions(challenge) {
  const grader = lodash.isPlainObject(challenge.grader) ? challenge.grader : {};
  const locale = String(challenge.targetLanguage || grader.language || '').trim() || getUiLocale();

  if (NAMING_CHALLENGE_TYPES.indexOf(challenge.type) >= 0) {
    if (lodash.isArray(challenge.correctSolutions)) {
      return solution.fromNamingSolutions(challenge.correctSolutions, locale);
    }
  } else if (WORD_BANK_CHALLENGE_TYPES.indexOf(challenge.type) >= 0) {
    if (lodash.isArray(challenge.correctTokens)) {
      return solution.fromWordBankTokens(challenge.correctTokens, locale);
    }
  } else if (
    lodash.isPlainObject(grader)
    && lodash.isArray(grader.vertices)
    && (grader.vertices.length > 0)
  ) {
    return solution.fromVertices(grader.vertices, false, locale);
  }

  return [];
}

/**
 * Prepares the different challenges for a freshly started practice session.
 * @param {Array} newChallenges
 */
function handleNewChallenges(newChallenges) {
  currentTranslationChallenges = {};
  currentNamingChallenges = {};
  currentListeningChallenges = {};

  newChallenges.forEach(challenge => {
    const solutions = getChallengeSolutions(challenge);

    if (solutions.length > 0) {
      const statement = String(challenge.prompt || '').normalize().trim();

      if (
        ('' !== statement)
        && (TRANSLATION_CHALLENGE_TYPES.indexOf(challenge.type) >= 0)
      ) {
        currentTranslationChallenges[statement] = {
          statement,
          solutions: lodash.uniqWith(solutions, lodash.isEqual),
          isNamingChallenge: NAMING_CHALLENGE_TYPES.indexOf(challenge.type) >= 0,
        };
      } else if (
        (LISTENING_CHALLENGE_TYPES.indexOf(challenge.type) >= 0)
        && ('' !== String(challenge.solutionTranslation || '').trim())
      ) {
        const solutionTranslation = String(challenge.solutionTranslation.normalize()).trim();

        currentListeningChallenges[solutionTranslation] = {
          statement,
          solutions: lodash.uniqWith(solutions, lodash.isEqual),
          isNamingChallenge: false,
        };
      }
    }
  });

  currentNamingChallenges = lodash.filter(currentTranslationChallenges, it.isNamingChallenge);
}

/**
 * A RegExp for the URL that is used by Duolingo to start a new practice session.
 * @type {RegExp}
 */
const NEW_SESSION_URL_REGEXP = /\/[\d]{4}-[\d]{2}-[\d]{2}\/sessions/g;

const originalRequestOpen = XMLHttpRequest.prototype.open;

XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
  if (url.match(NEW_SESSION_URL_REGEXP)) {
    this.addEventListener('load', () => {
      try {
        const data = lodash.isPlainObject(this.response)
          ? this.response
          : JSON.parse(this.responseText);

        if (lodash.isPlainObject(data)) {
          const baseChallenges = lodash.isArray(data.challenges) ? data.challenges : [];
          const adaptiveChallenges = lodash.isArray(data.adaptiveChallenges) ? data.adaptiveChallenges : [];
          handleNewChallenges(baseChallenges.concat(adaptiveChallenges));
        }
      } catch (error) {
        logError(error, 'Could not prepare the translation challenges for the new practice session: ');
      }
    });
  }

  return originalRequestOpen.call(this, method, url, async, user, password);
};

/**
 * A CSS selector for the wrapper of the current translation challenge.
 * @type {string}
 */
const TRANSLATION_CHALLENGE_WRAPPER = TRANSLATION_CHALLENGE_TYPES
  .map(type => `[data-test="challenge challenge-${type}"]`)
  .join(', ');

/**
 * A CSS selector for the wrapper of the current listening challenge.
 * @type {string}
 */
const LISTENING_CHALLENGE_WRAPPER = LISTENING_CHALLENGE_TYPES
  .map(type => `[data-test="challenge challenge-${type}"]`)
  .join(', ');

/**
 * A CSS selector for the header of the current challenge.
 * @type {string}
 */
const CHALLENGE_HEADER_SELECTOR = '[data-test=challenge-header]';

/**
 * A CSS selector for the statement of the current challenge, holding the sentence to translate.
 * @type {string}
 */
const CHALLENGE_STATEMENT_SELECTOR = '[data-test=hint-sentence]';

/**
 * A CSS selector for the hints added to the statement of the current challenge.
 * @type {string}
 */
const CHALLENGE_STATEMENT_HINT_SELECTOR = '[data-test=hint-popover]';

/**
 * A CSS selector for the translated solution of the current challenge.
 * @type {string}
 */
const CHALLENGE_TRANSLATED_SOLUTION_SELECTOR = '.vpbSG > *:last-child > .TnCw3';

/**
 * A CSS selector for all the different kinds of answer input which are not based on the word bank.
 * @type {string}
 */
const ANSWER_INPUT_SELECTOR = [
  'input[data-test=challenge-text-input]',
  'textarea[data-test=challenge-translate-input]',
].join(', ');

/**
 * A CSS selector for the container of the answer tokens selected from the word bank.
 * @type {string}
 */
const ANSWER_SELECTED_TOKEN_CONTAINER_SELECTOR = '._3vVWl';

/**
 * A CSS selector for an answer token selected from the word bank.
 * @type {string}
 */
const ANSWER_SELECTED_TOKEN_SELECTOR = '[data-test=challenge-tap-token]';

/**
 * A CSS selector for the footer of the current challenge screen, holding the result and actions elements.
 * @type {string}
 */
const CHALLENGE_FOOTER_SELECTOR = '._1obm2';

/**
 * A CSS selector for the result wrapper of the current challenge screen.
 * @type {string}
 */
const RESULT_WRAPPER_SELECTOR = '._1Ag8k';

/**
 * The class name which is applied to the result wrapper when the user has given a correct answer.
 * @type {string}
 */
const RESULT_WRAPPER_CORRECT_CLASS_NAME = '_1WH_r';

/**
 * A CSS selector for the solution wrapper of the current challenge screen, holding the answer key to the challenge.
 * @type {string}
 */
const SOLUTION_WRAPPER_SELECTOR = '.vpbSG';

/**
 * A CSS selector for the list of action links of the current challenge screen.
 * @type {string}
 */
const ACTION_LINK_LIST_SELECTOR = '._1Xpok';

/**
 * The UI elements used to wrap the different components rendered by the extension.
 * @type {Object.<string, Element>}
 */
const componentWrappers = {};

/**
 * Returns a wrapper element for a component of the extension.
 * @param {Function} component
 * @param {Element} parentElement
 * @returns {Element}
 */
function getComponentWrapper(component, parentElement) {
  if (!componentWrappers[component.name] || !componentWrappers[component.name].isConnected) {
    const wrapper = document.createElement('div');
    wrapper.id = getUniqueElementId(EXTENSION_PREFIX + component.name + '-');
    componentWrappers[component.name] = wrapper;
  }

  parentElement.appendChild(componentWrappers[component.name]);

  return componentWrappers[component.name];
}

/**
 * Renders a solution that comes closest to an user answer in the challenge screen.
 * @param {Solution} closestSolution
 * @param {Symbol} result
 */
function renderClosestSolution(closestSolution, result) {
  try {
    const solutionWrapper = document.querySelector(SOLUTION_WRAPPER_SELECTOR);

    if (solutionWrapper) {
      render(
        <IntlProvider definition={getTranslations(getUiLocale())}>
          <ClosestSolution solution={solution.toDisplayableString(closestSolution, false)} result={result}/>
        </IntlProvider>,
        getComponentWrapper(ClosestSolution, solutionWrapper)
      );
    } else {
      throw new Error('Could not find the solution wrapper element.');
    }
  } catch (error) {
    logError(error, 'Could not render the closest solution: ');
  }
}

/**
 * Whether the solution list modal is currently displayed.
 * @type {boolean}
 */
let isSolutionListModalDisplayed = false;

/**
 * Renders a solution list modal in the challenge screen.
 * @param {Challenge} challenge
 * @param {string} userAnswer
 */
function renderSolutionListModal(challenge, userAnswer) {
  try {
    if (isSolutionListModalDisplayed) {
      return;
    }

    // Use a unique key to always reopen the modal.
    const modalKey = new Date().getTime().toString();
    isSolutionListModalDisplayed = true;

    render(
      <IntlProvider definition={getTranslations(getUiLocale())}>
        <SolutionListModal key={modalKey}
                           {...challenge}
                           userAnswer={userAnswer}
                           onClose={() => {
                             isSolutionListModalDisplayed = false;
                           }}/>
      </IntlProvider>,
      getComponentWrapper(SolutionListModal, document.body)
    );
  } catch (error) {
    logError(error, 'Could not render the solution list modal: ');
  }
}

/**
 * Renders a solution list link in the challenge screen.
 * @param {Challenge} challenge
 * @param {Symbol} result
 * @param {string} userAnswer
 */
function renderSolutionListLink(challenge, result, userAnswer) {
  try {
    const actionLinkList = document.querySelector(ACTION_LINK_LIST_SELECTOR);

    if (actionLinkList) {
      render(
        <IntlProvider definition={getTranslations(getUiLocale())}>
          <SolutionListLink result={result}
                            solutions={challenge.solutions}
                            onClick={() => renderSolutionListModal(challenge, userAnswer)}/>
        </IntlProvider>,
        getComponentWrapper(SolutionListLink, actionLinkList)
      );
    } else {
      throw new Error('Could not find the action link list element.');
    }
  } catch (error) {
    logError(error, 'Could not render the solution list link: ');
  }
}

/**
 * The last seen challenge footer element.
 * @type {Element|null}
 */
let challengeFooter = null;

/**
 * The last seen result wrapper element.
 * @type {Element|null}
 */
let resultWrapper = null;

/**
 * The last completed challenge.
 * @type {object|null}
 */
let completedChallenge = null;

/**
 * Handles the result of the current challenge.
 * @param {Object} challenge
 * @param {Element} resultWrapper
 * @returns {boolean}
 */
function handleChallengeResult(challenge, resultWrapper) {
  if (lodash.isPlainObject(challenge)) {
    const result = resultWrapper.classList.contains(RESULT_WRAPPER_CORRECT_CLASS_NAME)
      ? RESULT_CORRECT
      : RESULT_INCORRECT;

    const answerInput = document.querySelector(ANSWER_INPUT_SELECTOR);
    let userAnswer = (answerInput && answerInput.value && String(answerInput.value).trim()) || '';

    if ('' === userAnswer) {
      const tokenContainer = document.querySelector(ANSWER_SELECTED_TOKEN_CONTAINER_SELECTOR)

      if (tokenContainer) {
        const tokens = Array.from(tokenContainer.querySelectorAll(ANSWER_SELECTED_TOKEN_SELECTOR));
        userAnswer = tokens.map(token => token.innerText.trim()).join(' ').normalize().trim();
      }
    }

    if ('' === userAnswer) {
      challenge.solutions.forEach(lodash.set(_, 'score', 0));
    } else {
      challenge.solutions.forEach(item => lodash.set(item, 'score', solution.matchAgainstAnswer(item, userAnswer)));
    }

    completedChallenge = { challenge, result, userAnswer };

    if (
      userAnswer
      && (RESULT_INCORRECT === result)
      && (challenge.solutions.length > 1)
    ) {
      renderClosestSolution(lodash.maxBy(challenge.solutions, 'score'), result);
    }

    renderSolutionListLink(challenge, result, userAnswer);

    return true;
  }

  return false;
}

/**
 * Handles the result of the current translation challenge.
 * @param {Element} resultWrapper
 * @returns {boolean}
 */
function handleTranslationChallengeResult(resultWrapper) {
  const challengeWrapper = document.querySelector(TRANSLATION_CHALLENGE_WRAPPER);

  if (!challengeWrapper) {
    return false;
  }

  const statementWrapper = document.querySelector(CHALLENGE_STATEMENT_SELECTOR)
    || document.querySelector(CHALLENGE_HEADER_SELECTOR);

  if (!statementWrapper) {
    return false;
  }

  const cleanWrapper = statementWrapper.cloneNode(true);
  const elementHints = cleanWrapper.querySelectorAll(CHALLENGE_STATEMENT_HINT_SELECTOR);

  if (elementHints.length > 0) {
    elementHints.forEach(hint => hint.parentNode.removeChild(hint));
  }

  const statement = cleanWrapper.innerText.normalize().trim();

  let result = handleChallengeResult(
    currentTranslationChallenges[statement],
    resultWrapper
  );

  if (!result) {
    const challenge = currentNamingChallenges.find(statement.indexOf(_.statement) >= 0);

    if (challenge) {
      result = handleChallengeResult(
        currentTranslationChallenges[challenge.statement],
        resultWrapper
      );
    }
  }

  return result;
}

/**
 * Handles the result of the current listening challenge.
 * @param {Element} resultWrapper
 * @returns {boolean}
 */
function handleListeningChallengeResult(resultWrapper) {
  const challengeWrapper = document.querySelector(LISTENING_CHALLENGE_WRAPPER);

  if (!challengeWrapper) {
    return false;
  }

  const translatedSolutionWrapper = document.querySelector(CHALLENGE_TRANSLATED_SOLUTION_SELECTOR);

  if (!translatedSolutionWrapper) {
    return false;
  }

  const solution = translatedSolutionWrapper.innerText.normalize().trim();

  return handleChallengeResult(
    currentListeningChallenges[solution],
    resultWrapper
  );
}

/**
 * A mutation observer for the footer of the challenge screen, detecting and handling challenge results.
 * @type {MutationObserver}
 */
const mutationObserver = new MutationObserver(() => {
  if (!challengeFooter) {
    return;
  }

  const newResultWrapper = challengeFooter.querySelector(RESULT_WRAPPER_SELECTOR);

  if (newResultWrapper !== resultWrapper) {
    resultWrapper = newResultWrapper;
    completedChallenge = null;

    if (null !== resultWrapper) {
      try {
        if (!handleListeningChallengeResult(resultWrapper)) {
          handleTranslationChallengeResult(resultWrapper);
        }
      } catch (error) {
        logError(error, 'Could not handle the challenge result: ');
      }
    }
  }
});

document.addEventListener('keydown', event => {
  if (
    !event.ctrlKey
    && (null !== completedChallenge)
    && (event.key.toLowerCase() === 's')
  ) {
    discardEvent(event);
    renderSolutionListModal(completedChallenge.challenge, completedChallenge.userAnswer);
  }
});

setInterval(() => {
  const newChallengeFooter = document.querySelector(CHALLENGE_FOOTER_SELECTOR);

  if (newChallengeFooter) {
    if (newChallengeFooter !== challengeFooter) {
      challengeFooter = newChallengeFooter;
      mutationObserver.disconnect();
      mutationObserver.observe(challengeFooter, { childList: true, subtree: true });
    }
  } else {
    completedChallenge = null;
  }
}, 50);
