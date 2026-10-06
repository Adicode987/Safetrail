import type { AlertRecord } from "./types";

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  History: undefined;
  Me: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  StartJourney: undefined;
  AlertSent: { alert: AlertRecord };
};
