import { a, defineData, type ClientSchema } from '@aws-amplify/backend'

const schema = a.schema({
  DailyReport: a
    .model({
      date: a.string().required(),
      moneyNineAM: a.float(),
      moneyTwelvePM: a.float(),
      currentKL: a.float(),
      newTankerKL: a.float(),
      tankers: a.float().array(),
    })
    .identifier(['date'])
    .authorization((allow) => [allow.publicApiKey()]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
})
