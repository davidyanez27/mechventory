import i18n from '../src/i18n';

// The suite asserts on rendered English copy, so pin the language regardless of
// the machine's locale (the app defaults to the browser detector otherwise).
await i18n.changeLanguage('en');
