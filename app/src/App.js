import logo from './logo.svg';
import './App.css';
import {Button, Container, Row, Col} from 'react-bootstrap';
import Sidebar from './Components/Sidebar/Sidebar'


function App() {
  //Displays the main page with the sidebar
  return (
      <Container fluid className="nopadding">
        <Row>
          <Col md="auto"><Sidebar></Sidebar></Col>
          <Col>Column 2</Col>
        </Row>
      </Container>       
  );
}

export default App;
