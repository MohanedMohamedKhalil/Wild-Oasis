import Image from 'next/image';
import { signIn } from '../_lib/auth';
import { signInAction } from '../_lib/actions';

export const metadata = {
  title: 'Login',
};

function SignInButton() {
  return (
    // Use server actions to get interactivity on server .
    <form action={signInAction}>
      <button className='flex gap-6 text-lg border border-primary-300 px-10 py-4 font-medium'>
        <Image
          src='https://authjs.dev/img/providers/google.svg'
          alt='Google logo'
          height='24'
          width='24'
        />
        <span>Continue with Google</span>
      </button>
    </form>
  );
}

export default SignInButton;
