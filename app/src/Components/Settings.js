import { React, Component } from 'react';
import { Container, Row } from 'react-bootstrap';
import '../App.css'
export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'default'
    }
  }

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
