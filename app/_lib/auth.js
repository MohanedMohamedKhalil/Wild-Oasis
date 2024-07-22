import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createGuest, getGuest } from './data-service';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    // authorized function will be executed each time user access accout page
    authorized({ auth, request }) {
      // if user try to access accout page but not logged in will be redirect to login page
      return !!auth?.user;
    },
    // signIn function will be executed each time before user log-in
    async signIn({ user, account, credentials }) {
      try {
        const existingGuest = await getGuest(user.email);

        if (!existingGuest) {
          // create new guest
          await createGuest({ email: user.email, fullName: user.name });
        }
        return true;
      } catch {
        return false;
      }
    },
    // session function will be called each time after signIn callback and each time auth() function get called
    async session({ session, user, token }) {
      // Send properties to the client, like an access_token and user-id from a provider.
      const guest = await getGuest(session.user.email);
      session.user.guestId = guest.id;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signout: '/logout',
  },
};
export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(authOptions);
