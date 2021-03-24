import {Button, Container} from 'react-bootstrap';
import Logo from '../../notcord.png';
import {React, Component} from 'react';

export default class Login extends Component {
  constructor(props){
    super(props);
    this.state = {
      username: 'billy',
      passwordHash: '12345'
    }
  }


    handleSubmit = (e) => {
      const { username, passwordHash } = this.state;
      fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password_hash: passwordHash
        })
      })
    }



    render(){
    return (
      <Container>
          <Button onClick={this.handleSubmit}>Hi</Button>
      </Container>
    );
  }
}
  