import { React, Component } from 'react';
import { Button, Container, Form, Row, Col} from 'react-bootstrap';
import Logo from '../notcord.png';
import '../App.css'

let loaderWheel = "loader noDisplay"
let loaderButton = "LoginButton"
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      shouldShowButton: true,
      test: true
    }
  }

  handleSubmit = (e) => {
    const { username, password } = this.state;
    this.setState({shouldShowButton: false}, () => {
      console.log("Showing Button: " + this.state.shouldShowButton);

      // FEATURE: Allow users to login and signup using their email address
      fetch(process.env.REACT_APP_API_URL + '/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username,
          password: password
        })
      }).then(res =>
          res.json()
      ).then(res => {
        // FEATURE: create bootstrap alert for errors / success
        // TODO: setup a delay for the success message loading wheel
        if (res === "Ok") {
          console.log(res)
          this.props.loggedIn(true)
          this.props.setView("dashboard")
        } else {
          console.log(res)
        }
      })

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
            <Col className="offset-3">
            <Button varient="primary" onClick={this.handleSubmit} className={ this.state.shouldShowButton ? '' : 'noDisplay' }>Login</Button>
            <div className={ this.state.shouldShowButton ? 'noDisplay' : 'loader'}></div>
           
            </Col>
            
          </Form>
        </Row>
        <Row>
          {/** TODO: Move this to an appropriate location. Make website not the webapp. URL: app.notcord.com, and privacy policy will be at notcord.com/privacy */}
          <a href='http://localhost:3000/privacy.html' target="_blank">Privacy Policy</a></Row>
      </Container>
    );
  }
}
