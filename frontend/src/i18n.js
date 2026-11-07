import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to Fix My Spot',
      tagline: 'Report civic issues. Track progress. Build better communities.',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      role: 'Role',
      citizen: 'Citizen',
      municipal: 'Municipal Worker',
      reportIssue: 'Report Issue',
      myIssues: 'My Issues',
      leaderboard: 'Leaderboard',
      dashboard: 'Dashboard',
      allIssues: 'All Issues',
      pending: 'Pending',
      inProgress: 'In Progress',
      resolved: 'Resolved',
      title: 'Title',
      description: 'Description',
      category: 'Category',
      location: 'Location',
      status: 'Status',
      submit: 'Submit',
      cancel: 'Cancel',
      points: 'Points',
      badges: 'Badges',
      issuesReported: 'Issues Reported',
      selectCategory: 'Select Category',
      uploadPhoto: 'Upload Photo',
      recordVoice: 'Record Voice',
      or: 'OR',
      signInWith: 'Sign in with',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      signUp: 'Sign Up',
      signIn: 'Sign In'
    }
  },
  hi: {
    translation: {
      welcome: 'फिक्स माय स्पॉट में आपका स्वागत है',
      tagline: 'नागरिक मुद्दों की रिपोर्ट करें। प्रगति ट्रैक करें। बेहतर समुदाय बनाएं।',
      login: 'लॉगिन',
      register: 'रजिस्टर',
      logout: 'लॉगआउट',
      email: 'ईमेल',
      password: 'पासवर्ड',
      name: 'नाम',
      role: 'भूमिका',
      citizen: 'नागरिक',
      municipal: 'नगर निगम कर्मचारी',
      reportIssue: 'समस्या दर्ज करें',
      myIssues: 'मेरी समस्याएं',
      leaderboard: 'लीडरबोर्ड',
      dashboard: 'डैशबोर्ड',
      allIssues: 'सभी समस्याएं',
      pending: 'लंबित',
      inProgress: 'प्रगति में',
      resolved: 'हल',
      title: 'शीर्षक',
      description: 'विवरण',
      category: 'श्रेणी',
      location: 'स्थान',
      status: 'स्थिति',
      submit: 'जमा करें',
      cancel: 'रद्द करें',
      points: 'अंक',
      badges: 'बैज',
      issuesReported: 'रिपोर्ट की गई समस्याएं',
      selectCategory: 'श्रेणी चुनें',
      uploadPhoto: 'फोटो अपलोड करें',
      recordVoice: 'आवाज रिकॉर्ड करें',
      or: 'या',
      signInWith: 'के साथ साइन इन करें',
      dontHaveAccount: 'खाता नहीं है?',
      alreadyHaveAccount: 'पहले से खाता है?',
      signUp: 'साइन अप',
      signIn: 'साइन इन'
    }
  },
  mr: {
    translation: {
      welcome: 'फिक्स माय स्पॉटमध्ये आपले स्वागत आहे',
      tagline: 'नागरी समस्या नोंदवा. प्रगती ट्रॅक करा. चांगले समुदाय तयार करा.',
      login: 'लॉगिन',
      register: 'नोंदणी',
      logout: 'लॉगआउट',
      email: 'ईमेल',
      password: 'पासवर्ड',
      name: 'नाव',
      role: 'भूमिका',
      citizen: 'नागरिक',
      municipal: 'नगरपालिका कर्मचारी',
      reportIssue: 'समस्या नोंदवा',
      myIssues: 'माझ्या समस्या',
      leaderboard: 'लीडरबोर्ड',
      dashboard: 'डॅशबोर्ड',
      allIssues: 'सर्व समस्या',
      pending: 'प्रलंबित',
      inProgress: 'प्रगतीपथावर',
      resolved: 'निराकरण',
      title: 'शीर्षक',
      description: 'वर्णन',
      category: 'श्रेणी',
      location: 'स्थान',
      status: 'स्थिती',
      submit: 'सबमिट',
      cancel: 'रद्द करा',
      points: 'गुण',
      badges: 'बॅज',
      issuesReported: 'नोंदवलेल्या समस्या',
      selectCategory: 'श्रेणी निवडा',
      uploadPhoto: 'फोटो अपलोड करा',
      recordVoice: 'आवाज रेकॉर्ड करा',
      or: 'किंवा',
      signInWith: 'सह साइन इन करा',
      dontHaveAccount: 'खाते नाही?',
      alreadyHaveAccount: 'आधीच खाते आहे?',
      signUp: 'साइन अप',
      signIn: 'साइन इन'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
