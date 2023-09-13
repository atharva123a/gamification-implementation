import UserSchema from '../user/userSchema';

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../config';

import shortid from 'shortid';
import logger from './logger';
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/google/callback',
      passReqToCallback: true
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        const user: any = await UserSchema.findOne({
          email: profile.emails[0].value
        });
        if (!user) {
          const username =
            profile.displayName.replace(' ', '').toLowerCase() +
            '#' +
            Math.floor(Math.random() * 1000000 + 1).toString();
          let lastName = ' ';
          if (profile.name.familyName !== undefined)
            lastName = profile.name.familyName;
          let newUser: any = new UserSchema({
            username,
            firstName: profile.name.givenName,
            lastName,
            profileImg: profile.photos[0].value,
            email: profile.emails[0].value,
            accounts: [
              {
                type: 'GOOGLE'
              }
            ],
            couponCode: `${username}_30`
          });
          await UserSchema.create(newUser);
          return done(null, {
            id: newUser._id
          });
        } else {
          return done(null, {
            id: user._id
          });
        }
      } catch (err) {
        let error = err.message || err;
        logger.error(error);
      }
    }
  )
);
