import { a, defineData, type ClientSchema } from '@aws-amplify/backend'
import { createUserFn } from '../functions/create-user/resource'

const schema = a.schema({
  DailyReport: a
    .model({
      date: a.string().required(),
      hsdNozzle1Closing: a.float(),
      hsdNozzle1Opening: a.float(),
      hsdNozzle2Closing: a.float(),
      hsdNozzle2Opening: a.float(),
      msNozzle1Closing: a.float(),
      msNozzle1Opening: a.float(),
      msNozzle2Closing: a.float(),
      msNozzle2Opening: a.float(),
      hsdRate: a.float(),
      msRate: a.float(),
      phonePay: a.float(),
      cardPay: a.float(),
      ttPrice: a.float(),
      ttSold: a.float(),
      note500: a.float(),
      note200: a.float(),
      note100: a.float(),
      note50: a.float(),
      note20: a.float(),
      note10: a.float(),
      coins: a.float(),
      comment: a.string(),
    })
    .identifier(['date'])
    .authorization((allow) => [allow.authenticated()]),

  createUser: a
    .mutation()
    .arguments({
      username: a.string().required(),
      password: a.string().required(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(createUserFn)),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
