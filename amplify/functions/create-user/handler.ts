import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider'
import type { Schema } from '../../data/resource'

const client = new CognitoIdentityProviderClient()

const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.'

const meetsPasswordPolicy = (password: string) =>
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^a-zA-Z0-9]/.test(password)

export const handler: Schema['createUser']['functionHandler'] = async (event) => {
  const { username, password } = event.arguments
  const userPoolId = process.env.AMPLIFY_AUTH_USERPOOL_ID

  if (!meetsPasswordPolicy(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE)
  }

  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [
          { Name: 'email', Value: username },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS',
      }),
    )
  } catch (error) {
    // If a previous attempt created the user but failed before the password
    // was set, don't fail here — fall through and (re)set the password below
    // so the account gets repaired instead of stuck unusable.
    if (!(error instanceof UsernameExistsException)) {
      throw error
    }
  }

  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    }),
  )

  return 'User created successfully'
}
