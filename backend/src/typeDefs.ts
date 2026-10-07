export const typeDefs = `
  enum JourneyStatus {
    ACTIVE
    AWAITING_RESPONSE
    COMPLETED
    ALERT_SENT
  }

  enum AlertType {
    SOS
    JOURNEY_NO_RESPONSE
    USER_REQUESTED
  }

  enum AlertStatus {
    SENT
    FAILED
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    createdAt: String!
  }

  type Contact {
    id: ID!
    name: String!
    email: String!
    phone: String
  }

  type Journey {
    id: ID!
    destinationLabel: String!
    startLat: Float!
    startLng: Float!
    expectedArrival: String!
    status: JourneyStatus!
    confirmDeadline: String
    createdAt: String!
    endedAt: String
  }

  type AlertRecipient {
    name: String!
    email: String!
  }

  type Alert {
    id: ID!
    type: AlertType!
    lat: Float!
    lng: Float!
    mapLink: String!
    message: String!
    recipients: [AlertRecipient!]!
    status: AlertStatus!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input AddContactInput {
    name: String!
    email: String!
    phone: String
  }

  input StartJourneyInput {
    destinationLabel: String!
    startLat: Float!
    startLng: Float!
    expectedArrival: String!
  }

  type Query {
    health: String!
    me: User
    contacts: [Contact!]!
    activeJourney: Journey
    alerts: [Alert!]!
  }

  type Mutation {
    signUp(name: String!, email: String!, password: String!, phone: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    addContact(input: AddContactInput!): Contact!
    removeContact(id: ID!): Boolean!
    triggerSos(lat: Float!, lng: Float!): Alert!
    startJourney(input: StartJourneyInput!): Journey!
    markArrived(journeyId: ID!): Journey!
    confirmSafe(journeyId: ID!): Journey!
    sendAlertNow(journeyId: ID!, lat: Float!, lng: Float!): Alert!
  }
`;
