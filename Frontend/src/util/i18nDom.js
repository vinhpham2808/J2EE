import { translatePhrase, SUPPORTED_LANGUAGES } from "./i18n.js";

const ORIGINAL_TEXT = new WeakMap();
const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"];
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"]);

function shouldSkipElement(element) {
  return SKIPPED_TAGS.has(element.tagName) || element.hasAttribute("data-no-translate");
}

function translateTextNode(node, dictionaries, language) {
  if (node.parentElement && shouldSkipElement(node.parentElement)) {
    return;
  }

  if (!ORIGINAL_TEXT.has(node)) {
    ORIGINAL_TEXT.set(node, node.nodeValue);
  } else {
    // If the DOM text no longer matches the translated version of our stored original in ANY
    // supported language, something external (e.g. React re-render) has updated the node.
    // Adopt the new value as the new original so we never revert React-rendered text.
    const storedOriginal = ORIGINAL_TEXT.get(node);
    const isTranslationOfOriginal = SUPPORTED_LANGUAGES.some((lang) => {
      const expected = translatePhrase(dictionaries, lang, storedOriginal);
      return node.nodeValue === expected;
    });
    if (!isTranslationOfOriginal) {
      ORIGINAL_TEXT.set(node, node.nodeValue);
    }
  }

  const originalText = ORIGINAL_TEXT.get(node);
  const translatedText = translatePhrase(dictionaries, language, originalText);
  if (node.nodeValue !== translatedText) {
    node.nodeValue = translatedText;
  }
}

function translateElementAttributes(element, dictionaries, language) {
  if (shouldSkipElement(element)) return;

  for (const attributeName of TRANSLATABLE_ATTRIBUTES) {
    if (!element.hasAttribute(attributeName)) continue;

    const originalAttributeName = `data-i18n-original-${attributeName}`;
    if (!element.hasAttribute(originalAttributeName)) {
      element.setAttribute(originalAttributeName, element.getAttribute(attributeName));
    }

    const originalValue = element.getAttribute(originalAttributeName);
    const translatedValue = translatePhrase(dictionaries, language, originalValue);
    if (element.getAttribute(attributeName) !== translatedValue) {
      element.setAttribute(attributeName, translatedValue);
    }
  }
}

function translateNode(node, dictionaries, language) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentElement && shouldSkipElement(node.parentElement)) return;
    translateTextNode(node, dictionaries, language);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE || shouldSkipElement(node)) return;

  translateElementAttributes(node, dictionaries, language);

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      if (shouldSkipElement(currentNode)) {
        currentNode = walker.nextSibling();
        continue;
      }
      translateElementAttributes(currentNode, dictionaries, language);
    } else if (currentNode.nodeType === Node.TEXT_NODE) {
      if (currentNode.parentElement && shouldSkipElement(currentNode.parentElement)) {
        currentNode = walker.nextNode();
        continue;
      }
      translateTextNode(currentNode, dictionaries, language);
    }
    currentNode = walker.nextNode();
  }
}

export function applyStaticTranslations(root, dictionaries, language) {
  if (!root) return;
  translateNode(root, dictionaries, language);
}

export function observeStaticTranslations(root, dictionaries, getLanguage) {
  if (!root) return () => {};

  applyStaticTranslations(root, dictionaries, getLanguage());

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        const node = mutation.target;
        const lang = getLanguage();
        // If React (or any external code) changed the text to something other than what
        // the observer would have set, treat the new value as the new "original" so we
        // don't revert dynamic data (e.g. numbers, API-loaded values) back to stale content.
        if (ORIGINAL_TEXT.has(node)) {
          const storedOriginal = ORIGINAL_TEXT.get(node);
          const isTranslationOfOriginal = SUPPORTED_LANGUAGES.some((l) => {
            const expected = translatePhrase(dictionaries, l, storedOriginal);
            return node.nodeValue === expected;
          });
          if (!isTranslationOfOriginal) {
            ORIGINAL_TEXT.set(node, node.nodeValue);
          }
        }
        translateTextNode(node, dictionaries, lang);
        continue;
      }

      if (mutation.type === "attributes") {
        translateElementAttributes(mutation.target, dictionaries, getLanguage());
        continue;
      }

      for (const addedNode of mutation.addedNodes) {
        translateNode(addedNode, dictionaries, getLanguage());
      }
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSLATABLE_ATTRIBUTES,
  });

  return () => observer.disconnect();
}
