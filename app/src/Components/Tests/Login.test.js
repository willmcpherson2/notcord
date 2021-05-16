import Login from '../Login';
import React from 'react';
import ReactDOM from 'react-dom';
import { render, within, fireEvent } from '@testing-library/react';


// Testing to see if text and image is rendered to assist users with logging in or registering a new user
test("Text and image rendering", () => {

  //create a div element simulating that the browser supports it
  // Then renders the Login page with the root variable as the element
  const root = document.createElement("div");
  ReactDOM.render(<Login />, root);
  const { getByText, getByLabelText, getByAltText, getByPlaceholderText} = within(root);

  //Testing that all labels and hyperlinks links are rendering and appearing on the page
  getByText("NotCord Login");
  getByText("Don't have an account?");
  getByText("Register Here");

  //Testing that the image source and alt text are rendering 
  getByAltText("NotCord Logo");

  //Testing that the placeholder text are rendering 
  getByPlaceholderText("Username");
  getByPlaceholderText("Password")
});


// Testing to see if input of user interaction is captured when logging in 
test("Allow users to enter username and password to login to the application", () => {
  const root = document.createElement("div");
  ReactDOM.render(<Login />, root);
  const { getByPlaceholderText } = within(root);

  // Creating variable for the username and password field
  const usernameInput = getByPlaceholderText(/Username/i);
  const passwordInput = getByPlaceholderText(/Password/i);

  //Simulating a user typing in there following username and password
  fireEvent.change(usernameInput, {target: {value: 'VER0001'}})
  fireEvent.change(passwordInput, {target: {value: 'JVMck65'}})

  //Ensuring that the text written by fireEvent change is displaying on the page
  expect(usernameInput.value).toEqual('VER0001');
  expect(passwordInput.value).toEqual('JVMck65');

  
});