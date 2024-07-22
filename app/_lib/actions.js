'use server'; // every function we export from here will become server action

import { revalidatePath } from 'next/cache';
import { auth, signIn, signOut } from './auth';
import { supabase } from './supabase';
import { getBookings } from './data-service';
import { redirect } from 'next/navigation';

export async function signInAction() {
  await signIn('google', { redirectTo: '/account' });
}
// export async function signInWithCredentialsAction(formData) {
//   const formObject = {};
//   formData.forEach((value, key) => {
//     formObject[key] = value;
//   });

//   await signIn('credentials', { ...formObject, redirectTo: '/account' });
// }

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export async function createReservation(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error('You must be logged in');

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get('numGuests')),
    observations: formData.get('observations').slice(0, 1000),
    extraPrice: 0,
    totalPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: 'unconfirmed',
  };

  const { error } = await supabase.from('bookings').insert([newBooking]);

  if (error) throw new Error('Booking could not be created');

  revalidatePath(`/cabins/${bookingData.cabinId}`);

  redirect('/cabins/thankyou');
}

export async function deleteReservation(bookingId) {
  // 1) Authentication
  const session = await auth();
  if (!session) {
    throw new Error('Please log in first');
  }

  // 2) Authorization
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to delete this booking');

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);

  if (error) {
    console.error(error);
    throw new Error('Booking could not be deleted');
  }
  // deactivate cashing for this page and revalidate the data again
  revalidatePath('/account/reservations');
}

export async function updateReservation(formData) {
  const bookingId = +formData.get('bookingId');

  // 1) Authentication
  const session = await auth();
  if (!session) {
    throw new Error('Please log in first');
  }

  // 2) Authorization
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingIds.includes(bookingId))
    throw new Error('You are not allowed to edit this booking');

  // 3) Updating Data
  const numGuests = +formData.get('numGuests');
  const observations = formData.get('observations').slice(0, 1000);
  const updatedFields = { numGuests, observations };

  // 4) Mutation
  const { error } = await supabase
    .from('bookings')
    .update(updatedFields)
    .eq('id', bookingId)
    .select()
    .single();

  // 5) Error Handling
  if (error) {
    console.error(error);
    throw new Error('Booking could not be updated');
  }
  // 6) Revalidating
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath(`/account/reservations`);

  // 7) Redirecting
  redirect('/account/reservations');
}

export async function updateGuestDetails(formData) {
  const session = await auth();
  if (!session) {
    throw new Error('Please log in first');
  }

  const nationalID = formData.get('nationalID');
  const [nationality, countryFlag] = formData.get('nationality').split('%');

  const regex = /^[a-zA-Z0-9]{6,15}$/;
  if (!regex.test(nationalID)) {
    throw new Error(' Please provide a valid national ID');
  }

  const newDetails = { nationality, countryFlag, nationalID };

  const { error } = await supabase
    .from('guests')
    .update(newDetails)
    .eq('id', session.user.guestId);

  if (error) throw new Error('Guest could not be updated');

  // deactivate cashing for this page and revalidate the data again
  revalidatePath('/account/profile');
}
