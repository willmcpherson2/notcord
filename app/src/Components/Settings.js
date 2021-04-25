import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../notcord.png';
import '../App.css'
export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'default'
    }
  }

  // TODO: Move this into the sidebar, this gets the username
  /*
  hasClicked = () => {
    fetch(process.env.REACT_APP_API_URL + '/get_username', {
      method: 'POST',
      credentials: 'include'
    }).then(res =>
      res.json()
  ).then(res => {
    this.setState({username: res})
    })
  }*/



  render() {
    return (
      <Container className='settings topPad'>
        <Row className="justify-content-md-center">
          <h2>Settings</h2>
        </Row>
      </Container>
    );
  }
}
