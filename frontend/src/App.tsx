import { BrowserRouter, Route, Routes} from "react-router-dom";
import Board from "./boards/Board";
import Home from "./home/Home";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={ <Home /> }/>
                <Route path="/board" element={ <Board id = "asdasd" /> }/>
            </Routes>

        </BrowserRouter>
        
    );
}

export default App;
