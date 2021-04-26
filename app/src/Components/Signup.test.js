import React from 'react';
import ReactDOM from 'react-dom';
import Signup from './Signup';
import {render, fireEvent, cleanup, getByText} from '@testing-library/react';

afterEach(cleanup)

// Testing that page renders with all elements
describe('Testing that the elements of the page render', () => {
    test('Text and image render', () => {

        const root = document.createElement("div");
        ReactDOM.render(<Signup />, root);
        const { getByText, getByAltText, getByPlaceholderText } = render(<Signup />, root);
        
        getByText('Register to NotCord');
        getByText('Already have an account?');
        getByText('Login Here');

        getByAltText('NotCord Logo');

        getByPlaceholderText('Username');
        getByPlaceholderText('Password');
        getByPlaceholderText('Password Confirm');
    });
});

// Tests the state changes when user inputs values into text boxes
describe('Testing Signup Page input', () => {
    test('Inputting text into username and password field updates the state', () => {
        const { getByPlaceholderText } = render(<Signup />);

        const usernameInputField = getByPlaceholderText(/Username/i);
        const passwordInputField = getByPlaceholderText('Password');
        const passwordConfirmInputField = getByPlaceholderText(/Password Confirm/i);
        
        fireEvent.change(usernameInputField, { target: { value: 'test' } });
        fireEvent.change(passwordInputField, { target: { value: 'pass' } });
        fireEvent.change(passwordConfirmInputField, { target: { value: 'pass' } });

        expect(usernameInputField.value).toEqual('test');
        expect(passwordInputField.value).toEqual('pass');
        expect(passwordConfirmInputField.value).toEqual('pass');
    });
});