import {Button, Container} from 'react-bootstrap';
import '../../App.css'
import Logo from '../../notcord.png'


function Sidebar() {
    return (
      <Container fluid className="sidebar">
          <img src={Logo} alt="Notcord Logo" className="image"></img>
          <hr className="hozLine"/>
      </Container>
    );
  }
  
  export default Sidebar;