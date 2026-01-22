import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './resources/en.json';
import tr from './resources/tr.json';
import el from './resources/el.json';
import ru from './resources/ru.json';

const resources = {
    en: { translation: en },
    tr: { translation: tr },
    el: { translation: el },
    ru: { translation: ru },
};

const initI18n = async () => {
    let locale = Localization.getLocales()[0].languageCode;
    // Default to 'tr' if user is in Cyprus or Turkey but phone is English (Optional Logic)
    // For now, respect phone setting, fallback to English
    if (locale !== 'tr' && locale !== 'el') {
        locale = 'en';
    }

    await i18n
        .use(initReactI18next)
        .init({
            compatibilityJSON: 'v4',
            resources,
            lng: locale, // Initial language
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
