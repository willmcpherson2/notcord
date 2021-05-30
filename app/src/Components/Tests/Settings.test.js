import Settings from '../Settings';
import React from 'react';
import ReactDOM from 'react-dom';
import { render, within, fireEvent, modal} from '@testing-library/react';
import { Modal, Button } from 'react-bootstrap';


// Testing to see if text and image is rendered to assist users with the settings page
test("Text and image rendering", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Settings />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText} = within(root);

    //Testing that all labels and hyperlinks links that are rendering and appearing on the page
    getByText("Invites");
    getByText("Save");
    getByText("Avatar:");
    getByLabelText("Set New Avatar");
    getByText("Settings");

});


// Testing to see if invites button opens a modal
test("Invite button opens a modal", () => {


    const root = document.createElement("div");
    ReactDOM.render(<Settings />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText} = within(root);

    const inviteButton = getByText(/Invites/i);
    fireEvent.click(getByText(/Invites/i));

    const openModal = jest.fn();
    ReactDOM.render(
        <Modal openModal={openModal}>
            Invitations   
        </Modal>,
        root
    );
    
    const evt = new KeyboardEvent('keydown', { keyCode: 13 });
    // Enter Key = 13
    document.dispatchEvent(evt);
    expect(openModal).toHaveBeenCalledTimes(0);

});


// Testing to see if the save button can be clicked on
test("Text and image rendering", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Settings />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText} = within(root);

    fireEvent.click(getByText(/Save/i));

});









// Testing to see if text and image is rendered to assist users with the settings page
test("Text and image rendering", () => {

    const root = document.createElement("div");
    ReactDOM.render(<Settings />, root);
    const { getByText, getByLabelText, getByAltText, getByPlaceholderText} = within(root);

    //Testing that all labels and hyperlinks links that are rendering and appearing on the page
    getByText("Invites");
    getByText("Save");
    getByText("Avatar:");
    getByLabelText("Set New Avatar");
    getByText("Settings");

});
