import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { createUserFn } from './functions/create-user/resource'

const backend = defineBackend({
  auth,
  data,
  createUserFn,
})

// Disable self-service sign-up: only admin-created users may ever exist.
// This sets the real Cognito UserPool property, which blocks the SignUp
// API itself (not just hides UI) — defineAuth has no flag for this.
const { cfnUserPool } = backend.auth.resources.cfnResources
cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
}
