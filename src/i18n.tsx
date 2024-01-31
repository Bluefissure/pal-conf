/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-floating-promises */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en_US from './assets/i18n/en-US.json';
import zh_CN from './assets/i18n/zh-CN.json';
import ja_JP from './assets/i18n/ja-JP.json';

const initConfig = {
    debug: false,
    fallbackLng: 'en_US',
    interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
        en_US: en_US,
        zh_CN: zh_CN,
        ja_JP: ja_JP
    }
};

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init(initConfig);


export default i18n;