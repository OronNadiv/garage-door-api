module.exports = `
type User {
  id: ID!
  name: String!
}

type State {
  id: ID!
  requestedBy: User
  createdAt: String!
  updatedAt: String
  isOpen: Boolean!
}

type Toggle {
  id: ID!
}

type Query {
  # gets recent states changes.
  states(count: Int = 20): [State]
}

type Mutation {
  # creates toggle request - user asks to open/close the door.
  createToggle(dummy: Int) : Toggle
  
  # create state change - door sensor reports new door state (open/close).
  createState(isOpen: Boolean!) : State
}
`
