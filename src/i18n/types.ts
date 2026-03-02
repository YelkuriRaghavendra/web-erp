import 'react-i18next';
import enUS from './locales/en-US.json';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof enUS;
    };
  }
}
