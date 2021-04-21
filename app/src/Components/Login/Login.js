import { React, Component } from 'react';
import { Button, Container, Form, Row, Col } from 'react-bootstrap';
import Logo from '../../notcord.png';
import '../../App.css'
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: ''
    }
  }

  handleSubmit = (e) => {
    const { username, password } = this.state;


      fetch(process.env.REACT_APP_API_URL + '/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      }).then(res =>
          res.json()
      ).then(res => {
        if (res === "Ok") {
          this.props.setView("dashboard")
        }
      })
  }


  handleUserChange = (e) => {
    this.setState({ username: e.target.value })
  }

  handlePassChange = (e) => {
    this.setState({ password: e.target.value })
  }

  register = () => {
    this.props.setView("signup")
  }



  render() {
    return (
      <Container className="Login">
        <Row className="justify-content-md-center">
          <img src={Logo} alt="NotCord Logo"></img>
        </Row>
        <Row className="justify-content-md-center">
          <h2>NotCord Login</h2>
        </Row>
        <Row className="justify-content-md-center">
          <Form.Text className="text-muted">Don't have an account? <button onClick={this.register}>Register Here</button></Form.Text><br></br>
        </Row>
        <Row className="justify-content-md-center">
          <Form >
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="Username" value={this.state.username} onChange={this.handleUserChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="Password" value={this.state.password} onChange={this.handlePassChange}></Form.Control>
            </Form.Group>
            <Col className="offset-3"><Button varient="primary" onClick={this.handleSubmit}>Login</Button></Col>
          </Form>

        </Row>
      </Container>
    );
  }
}
