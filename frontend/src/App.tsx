import { BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./home/Home";
import Layout from "./Layout";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/home" element={ <Home /> }/>
                <Route path="/" element={ <Layout> 
                    <div></div>
                    </Layout>}/>

            </Routes>

        </BrowserRouter>
        
    );
}

export default App;
