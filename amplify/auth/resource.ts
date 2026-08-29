import { defineAuth } from '@aws-amplify/backend'
import { createUserFn } from '../functions/create-user/resource'

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  access: (allow) => [
    allow.resource(createUserFn).to(['createUser', 'setUserPassword']),
  ],
})
