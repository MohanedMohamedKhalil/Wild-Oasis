import React from 'react';
import Spinner from '../_components/Spinner';

export default function Page() {
  return (
    <div className='grid justify-center items-center'>
      <Spinner />
      <p>Loading Cabin</p>
    </div>
  );
}
