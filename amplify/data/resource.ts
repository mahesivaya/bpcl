import { a, defineData, type ClientSchema } from '@aws-amplify/backend'
import { createUserFn } from '../functions/create-user/resource'

const schema = a.schema({
  DailyReport: a
    .model({
      date: a.string().required(),
      moneyNineAM: a.float(),
      moneyTwelvePM: a.float(),
      currentKL: a.float(),
      newTankerKL: a.float(),
      tankers: a.float().array(),
      saleKL: a.float(),
      ratePerLiter: a.float(),
      mobilePayment: a.float(),
      cashPayment: a.float(),
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
