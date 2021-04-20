import React from 'react';
import ReactDOM from 'react-dom';
import Signup from './Signup';
import {render, fireEvent, cleanup} from '@testing-library/react';

afterEach(cleanup)

// testing a controlled component form.
it('Inputting text into username and password field updates the state', () => {
    const { getByPlaceholderText , getByLabelText } = render(<Signup />);

    expect(getByPlaceholderText(/Username/i).textContent).toBe("");

    fireEvent.change(getByPlaceholderText(/Username/i), {target: {value: 'Text' } } )

    expect(getByPlaceholderText(/Username/i).textContent).toBeDefined();

    expect(getByPlaceholderText(/Password/i).textContent).toBe("");

    fireEvent.change(getByPlaceholderText(/Password/i), {target: {value: 'Text' } } )

    expect(getByPlaceholderText(/Password/i).textContent).toBeDefined();

})


