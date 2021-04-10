import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../../notcord.png';
import '../../App.css'
export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    }
  }



  render() {
    return (
      <Container className='settings'>
        <Row className="justify-content-md-center">
          <h2>Settings</h2>
        </Row>
      </Container>
    );
  }
}
