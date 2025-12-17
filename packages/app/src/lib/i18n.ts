import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonJa from '../locales/ja/common.json';
import inventoryJa from '../locales/ja/inventory.json';
import authJa from '../locales/ja/auth.json';
import organizationJa from '../locales/ja/organization.json';
import settingsJa from '../locales/ja/settings.json';
import commonEn from '../locales/en/common.json';
import inventoryEn from '../locales/en/inventory.json';
import authEn from '../locales/en/auth.json';
import organizationEn from '../locales/en/organization.json';
import settingsEn from '../locales/en/settings.json';

// リソース定義
const resources = {
    ja: {
        common: commonJa,
        inventory: inventoryJa,
        auth: authJa,
        organization: organizationJa,
        settings: settingsJa,
    },
    en: {
        common: commonEn,
        inventory: inventoryEn,
        auth: authEn,
        organization: organizationEn,
        settings: settingsEn,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        // lng: 'ja', // Remove hardcoded language to allow detector to work
        fallbackLng: 'ja',
        defaultNS: 'common',
        interpolation: {
            escapeValue: false, // ReactはXSS対策済み
        },
        detection: {
            order: ['navigator', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage'],
        }
    });

export default i18n;
