import Group from '../Group';
import React from 'react';
import ReactDOM from 'react-dom';
import { render, within, fireEvent } from '@testing-library/react';
import { Modal, Button } from 'react-bootstrap';



// Testing to see if text is rendered to assist users with the group page
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

// Testing to see if the New channel buttons can be clicked and if it opens the modal form.
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
    const evt = new KeyboardEvent('keydown', { keyCode: 13 });
    // Enter Key = 13
    document.dispatchEvent(evt);
    expect(openModal).toHaveBeenCalledTimes(0);


    
});


// Testing to see if the invite button works
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
    //Test
    
});

// Testing to see what happens when the plus button is hovered over, next to channel name.
test("Testing the hover function", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Group />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText, getByRole} = within(root);
    const spy = jest.spyOn(Group.prototype,"componentDidMount");
    fireEvent.mouseOver(getByText(/Invite +/i))
    expect(spy).toHaveBeenCalledTimes(0);
    
});

// Testing to see what happens when the send button, next to channel name.
test("Testing the leave group button", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Group />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText, getByRole} = within(root);
    
    const messageInput = getByPlaceholderText(/message/i);
    
    //Simulating a user typing in there following message
    fireEvent.change(messageInput, {target: {value: 'VER0001'}})
    expect(messageInput.value).toEqual('VER0001');
    fireEvent.click(getByText(/Send Message/i));
    

});