import React from 'react';
import ReactDOM from 'react-dom';
import Signup from './Signup';
import {render, fireEvent, cleanup, getByText} from '@testing-library/react';

afterEach(cleanup)

describe('Testing Signup Page input', () => {
    test('Inputting text into username and password field updates the state', () => {
        const { getByPlaceholderText } = render(<Signup />);

        const usernameInputField = getByPlaceholderText(/Username/i);
        const passwordInputField = getByPlaceholderText(/Passwords/i);
        const passwordConfirmInputField = getByPlaceholderText(/Password Confirm/i);
        
        fireEvent.change(usernameInputField, { target: { value: 'test' } });
        fireEvent.change(passwordInputField, { target: { value: 'pass' } });
        fireEvent.change(passwordConfirmInputField, { target: { value: 'pass' } });

        expect(usernameInputField.value).toEqual('test');
        expect(passwordInputField.value).toEqual('pass');
        expect(passwordConfirmInputField.value).toEqual('pass');
    });
});