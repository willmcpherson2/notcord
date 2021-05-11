import { React, Component } from 'react';
import { Button, Container, Form, Row, Alert } from 'react-bootstrap';
import Logo from '../notcord.png';
import '../App.css'
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      passConfirm: '',
      showAlert: false,
      alertMessage: '',
      success: false,
      shouldShowButton: true
    }
  }

  handleSubmit = async () => {
    const { username, password, passConfirm } = this.state;
    this.setState({shouldShowButton: false});

    if (password === passConfirm) {

      //This then posts the json of the username and password
      const data = await fetch(process.env.REACT_APP_API_URL + '/signup', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      })
      const signup = await data.json();
      //This part gets the response JSON body, and then logs that JSON.
      if (signup === "Ok") {
        console.log(signup)
        this.setState({
          alertMessage: "User Successfully Registered. You can now login",
          showAlert: true,
          success: true,
          shouldShowButton: true
        })
      } else {
        console.log(signup)
        this.setState({
          alertMessage: signup,
          showAlert: true,
          success: false,
          shouldShowButton: true
        })
      }
    } else {
      this.setState({
        alertMessage: "Passwords Do Not Match",
        showAlert: true,
        success: false,
        shouldShowButton: true
      })
    }
  }

  handleUserChange = (e) => {
    this.setState({ username: e.target.value })
  }
  handlePassChange = (e) => {
    this.setState({ password: e.target.value })
  }
  handlePassConfirmChange = (e) => {
    this.setState({ passConfirm: e.target.value })
  }

  alert() {
    return (
      <Alert variant={this.state.success ? 'success' : 'danger'} onClose={() => this.setState({ showAlert: false })} dismissible>
        {this.state.alertMessage}
      </Alert>
    );
  }

  render() {
    return (
      <Container className="Login">
        <Row className="justify-content-md-center">
          <img src={Logo} alt="NotCord Logo"></img>
        </Row>
        <Row className="justify-content-md-center">
          <h2>Register to NotCord</h2>
        </Row>
        <Row className={this.state.showAlert ? 'justify-content-md-center' : 'noDisplay'}>{this.alert()}</Row>
        <Row className="justify-content-md-center">
          <Form.Text className="text-muted">Already have an account? <button onClick={() => this.props.setView("login")}>Login Here</button></Form.Text><br></br>
        </Row>
        <Row className="justify-content-md-center">
          <Form id="notcordSignup">
            <Form.Group controlId="formUsername">
              <Form.Control type="text" placeholder="Username" value={this.state.username} onChange={this.handleUserChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPassword">
              <Form.Control type="password" placeholder="Password" value={this.state.password} onChange={this.handlePassChange}></Form.Control>
            </Form.Group>
            <Form.Group controlId="formPasswordConfirm">
              <Form.Control type="password" placeholder="Password Confirm" value={this.state.passConfirm} onChange={this.handlePassConfirmChange}></Form.Control>
            </Form.Group>
            <Button varient="primary" onClick={this.handleSubmit} className={ this.state.shouldShowButton ? 'button' : 'noDisplay' }>Register</Button>
            <div className={ this.state.shouldShowButton ? 'noDisplay' : 'rainbow-marker-loader'}></div>
          </Form>

        </Row>
      </Container>
    );
  }
}
