import Group from '../Group';
import React from 'react';
import ReactDOM from 'react-dom';
import { render, within, fireEvent } from '@testing-library/react';
import { Modal, Button } from 'react-bootstrap';



// Testing to see if text and image is rendered to assist users with the group page
test("Text and image rendering", () => {

  const root = document.createElement("div");
  ReactDOM.render(<Group />, root);
  const { getByText, getByLabelText, getByAltText, getByPlaceholderText, getByRole} = within(root);

  getByText("Send Message");
  getByText("Invite +");
  getByPlaceholderText("message");
  getByText("New Channel");
  getByText("Messages:");

});

// Testing to see if the New channel buttons can be clicked.
test("Testing the New Channel button", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Group />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText, getByRole} = within(root);
    
    // Creating variable for the new Channel button
    const newChannelButton = getByText(/New Channel/i);
    fireEvent.click(getByText(/New Channel/i));

    const openModal = jest.fn();
    ReactDOM.render(
        <Modal openModal={openModal}>
            It works
        </Modal>,
        root
    );
    const evt = new KeyboardEvent('keydown', { keyCode: 27 });
    // 27 == Escape Key
    document.dispatchEvent(evt);
    expect(openModal).toHaveBeenCalledTimes(0);


    
});


// Testing to see if I can input and send a message button.
test("Testing the New Channel button", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Group />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText, getByRole} = within(root);
    
    // Creating variable for the new Channel button
    const newChannelButton = getByText(/Invite +/i);
    fireEvent.click(getByText(/Invite +/i));
    
});




const testButton = ({ onClick, children }) => (
    <button onClick={onClick}>{children}</button>
)


// Testing to see if the New channel buttons load the modal form
test("Testing the New Channel button", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Group />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText, getByRole} = within(root);
  
    const handleClick = jest.fn()
    render(<testButton onClick={handleClick}>New Channel</testButton>)
    const newChannel = getByText(/New Channel/i);
    fireEvent.click(newChannel)
    expect(handleClick).toHaveBeenCalledTimes(0)
    
});


// Testing to see if the invite + button can be clicked.
test("Testing the invite + button", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Group />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText, getByRole} = within(root);
    
    // Creating variable for the new Channel button
    const newChannelButton = getByText(/Invite +/i);
    fireEvent.click(getByText(/Invite +/i));
    
});


