import { gql } from "@apollo/client";

export const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      phone
    }
  }
`;

export const CONTACTS_QUERY = gql`
  query Contacts {
    contacts {
      id
      name
      email
      phone
    }
  }
`;

export const SIGN_UP_MUTATION = gql`
  mutation SignUp(
    $name: String!
    $email: String!
    $password: String!
    $phone: String
  ) {
    signUp(name: $name, email: $email, password: $password, phone: $phone) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const ADD_CONTACT_MUTATION = gql`
  mutation AddContact($input: AddContactInput!) {
    addContact(input: $input) {
      id
      name
      email
      phone
    }
  }
`;

export const REMOVE_CONTACT_MUTATION = gql`
  mutation RemoveContact($id: ID!) {
    removeContact(id: $id)
  }
`;

export const ACTIVE_JOURNEY_QUERY = gql`
  query ActiveJourney {
    activeJourney {
      id
      destinationLabel
      startLat
      startLng
      expectedArrival
      status
      confirmDeadline
      createdAt
      endedAt
    }
  }
`;

export const ALERTS_QUERY = gql`
  query Alerts {
    alerts {
      id
      type
      lat
      lng
      mapLink
      message
      status
      createdAt
      recipients {
        name
        email
      }
    }
  }
`;

const ALERT_FIELDS = `
  id
  type
  lat
  lng
  mapLink
  message
  status
  createdAt
  recipients {
    name
    email
  }
`;

export const TRIGGER_SOS_MUTATION = gql`
  mutation TriggerSos($lat: Float!, $lng: Float!) {
    triggerSos(lat: $lat, lng: $lng) {
      ${ALERT_FIELDS}
    }
  }
`;

export const START_JOURNEY_MUTATION = gql`
  mutation StartJourney($input: StartJourneyInput!) {
    startJourney(input: $input) {
      id
      destinationLabel
      startLat
      startLng
      expectedArrival
      status
      confirmDeadline
      createdAt
    }
  }
`;

export const MARK_ARRIVED_MUTATION = gql`
  mutation MarkArrived($journeyId: ID!) {
    markArrived(journeyId: $journeyId) {
      id
      status
      endedAt
    }
  }
`;

export const CONFIRM_SAFE_MUTATION = gql`
  mutation ConfirmSafe($journeyId: ID!) {
    confirmSafe(journeyId: $journeyId) {
      id
      status
      expectedArrival
      confirmDeadline
    }
  }
`;

export const SEND_ALERT_NOW_MUTATION = gql`
  mutation SendAlertNow($journeyId: ID!) {
    sendAlertNow(journeyId: $journeyId) {
      ${ALERT_FIELDS}
    }
  }
`;
