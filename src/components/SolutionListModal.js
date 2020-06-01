import { Fragment, h } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { IntlProvider, Localizer, Text } from 'preact-i18n';
import { StyleSheet } from 'aphrodite';
import { noop } from 'lodash';
import { BASE, useLocalStorageList, useStyles } from './base';
import SolutionList from './SolutionList';
import { CLOSE_ICON_CDN_PATH } from '../constants';
import { discardEvent, getImageCdnBaseUrl } from '../functions';

const OVERLAY = 'overlay';
const WRAPPER = 'wrapper';
const CLOSE_BUTTON = 'close_button';
const SIZE_BUTTON = 'size_button';
const CONTENT = 'content';

const STATE_PENDING = Symbol('pending');
const STATE_OPENING = Symbol('opening');
const STATE_OPENED = Symbol('opened');
const STATE_CLOSING = Symbol('closing');
const STATE_CLOSED = Symbol('closed');

const MODAL_SIZE_DEFAULT = 'default';
const MODAL_SIZE_FIT_TO_CONTENT = 'fit_to_content';
const MODAL_SIZE_MAXIMIZED = 'maximized';

const MODAL_SIZES = {
  [MODAL_SIZE_DEFAULT]: {
    actionLabel: '↑',
    actionTitleId: 'minimize',
    defaultActionTitle: 'Minimize',
  },
  [MODAL_SIZE_FIT_TO_CONTENT]: {
    actionLabel: '↓',
    actionTitleId: 'fit_to_content',
    defaultActionTitle: 'Fit to content',
  },
  [MODAL_SIZE_MAXIMIZED]: {
    actionLabel: '↕',
    actionTitleId: 'maximize',
    defaultActionTitle: 'Maximize',
  },
};

const CLASS_NAMES = {
  [BASE]: {
    [OVERLAY]: [ '_16E8f', '_18rH6', '_3wo9p' ],
    [WRAPPER]: [ '_3Xf7y', 'w4pY4', '_1qa4z', '_3wo9p' ],
    [CLOSE_BUTTON]: [ '_2YJA9' ],
    [SIZE_BUTTON]: [ '_2YJA9' ],
    [CONTENT]: [ '_2vnDy' ],
  },
  [STATE_PENDING]: {
    [OVERLAY]: [ '_2WcLD' ],
    [WRAPPER]: [ '_2WcLD' ],
  },
  [STATE_OPENING]: {
    [OVERLAY]: [ '_39TEz' ],
    [WRAPPER]: [ '_2WcLD' ],
  },
  [STATE_OPENED]: {
    [OVERLAY]: [ '_39TEz' ],
    [WRAPPER]: [ '_39TEz' ],
  },
  [STATE_CLOSING]: {
    [OVERLAY]: [ '_2WcLD' ],
  },
};

const STYLE_SHEETS = {
  [BASE]: StyleSheet.create({
    [WRAPPER]: {
      maxWidth: 'calc(95vw - 30px)',
      maxHeight: 'calc(95vh - 30px)',
      '@media (max-width: 699px)': {
        maxWidth: '95vw',
        maxHeight: '95vh',
      },
    },
    [CONTENT]: {
      position: 'relative',
      maxHeight: 'calc(95vh - 90px)',
      overflowY: 'auto',
      paddingRight: '0.5em',
    },
    [SIZE_BUTTON]: {
      top: 'auto',
      bottom: '1px',
      left: 'auto',
      right: '1px',
      transform: 'rotate(-45deg)',
      border: 0,
      borderRadius: '100%',
      '@media (max-width: 699px)': {
        fontSize: '1.25em',
      },
    },
  }),
  [MODAL_SIZE_FIT_TO_CONTENT]: StyleSheet.create({
    [CONTENT]: {
      maxWidth: '100%',
    },
  }),
  [MODAL_SIZE_MAXIMIZED]: StyleSheet.create({
    [WRAPPER]: {
      width: 'calc(95vw - 30px)',
      height: 'calc(95vh - 30px)',
      maxWidth: 'none',
      maxHeight: 'none',
      '@media (max-width: 699px)': {
        width: '95vw',
        height: '95vh',
      },
    },
    [CONTENT]: {
      maxWidth: '100%',
      '@media (max-width: 699px)': {
        maxHeight: '100%',
      },
    },
  }),
};

const SolutionListModal =
  ({ statement = '', userAnswer = '', solutions = [], onClose = noop }) => {
    const [ modalState, setModalState ] = useState(STATE_PENDING);
    const contentWrapper = useRef();
    const listWrapper = useRef();
    const openedTimeout = useRef(null);

    const {
      state: modalSize,
      nextState: nextModalSize,
      next: setNextModalSize,
    } = useLocalStorageList(
      'modal-size',
      Object.keys(MODAL_SIZES),
      MODAL_SIZE_DEFAULT
    );

    const getElementClassNames = useStyles(CLASS_NAMES, STYLE_SHEETS, [ modalState, modalSize ]);

    const closeModal = useCallback(() => {
      if ([ STATE_CLOSING, STATE_CLOSED ].indexOf(modalState) === -1) {
        setModalState(STATE_CLOSING);

        setTimeout(() => {
          setModalState(STATE_CLOSED);
          onClose();
        }, 300);

        if (openedTimeout.current) {
          clearTimeout(openedTimeout.current);
        }
      }
    }, [ modalState, onClose ]);

    useEffect(() => {
      if ([ STATE_CLOSING, STATE_CLOSED ].indexOf(modalState) === -1) {
        const handleKeyDown = event => {
          if ('Escape' === event.key) {
            closeModal();
            discardEvent(event);
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [ modalState, closeModal ]);

    useEffect(() => {
      if (STATE_PENDING === modalState) {
        setTimeout(() => setModalState(STATE_OPENING), 1);
        openedTimeout.current = setTimeout(() => setModalState(STATE_OPENED), 300);
      }
    }, [ modalState ]);

    useEffect(() => {
      if (contentWrapper.current) {
        contentWrapper.current.focus();
      }
    }, [ contentWrapper ]);

    const onListChange = useCallback(() => {
      if (contentWrapper.current) {
        contentWrapper.current.focus();

        if (!listWrapper.current) {
          contentWrapper.current.scrollTo({ top: 0, behavior: 'auto' });
        } else {
          contentWrapper.current.scrollTo({ top: listWrapper.current.offsetTop - 10, behavior: 'smooth' });
        }
      }
    }, [ contentWrapper ]);

    if ((STATE_CLOSED === modalState) || (0 === solutions.length)) {
      return null;
    }

    return (
      <IntlProvider scope="solution.list.modal">
        <div className={getElementClassNames(OVERLAY)} onClick={closeModal}>
          <div className={getElementClassNames(WRAPPER)} role="dialog" tabIndex="-1" onClick={discardEvent}>
            <div className={getElementClassNames(CLOSE_BUTTON)} onClick={closeModal}>
              <img src={getImageCdnBaseUrl() + CLOSE_ICON_CDN_PATH} />
            </div>
            <Localizer>
              <div onClick={setNextModalSize}
                   className={getElementClassNames(SIZE_BUTTON)}
                   title={
                     <Text id={MODAL_SIZES[nextModalSize].actionTitleId}>
                       {MODAL_SIZES[nextModalSize].defaultActionTitle}
                     </Text>
                   }>
                {MODAL_SIZES[nextModalSize].actionLabel}
              </div>
            </Localizer>
            <div ref={contentWrapper} className={getElementClassNames(CONTENT)} tabIndex="0">
              {statement && (
                <Fragment>
                  <h3>
                    <Text id="statement">Statement:</Text>
                  </h3>
                  <p>{statement}</p>
                </Fragment>
              )}
              {userAnswer && (
                <Fragment>
                  <h3>
                    <Text id="your_answer">Your answer:</Text>
                  </h3>
                  <p>{userAnswer}</p>
                </Fragment>
              )}
              <div ref={listWrapper}>
                <SolutionList solutions={solutions} onPageChange={onListChange} />
              </div>
            </div>
          </div>
        </div>
      </IntlProvider>
    );
  };

export default SolutionListModal;
