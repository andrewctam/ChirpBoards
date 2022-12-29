import { createContext, useReducer } from "react";
import { BrowserRouter, Route, Routes} from "react-router-dom";
import Register from "./account/Register";
import Signin from "./account/Signin";
import Board from "./boards/Board";
import Home from "./home/Home";

type UserInfo = {
    username: string;
    sessionToken: string;
}

export interface PostChirp {
    id: string
    text: string
    postDate: string
    authorUsername: string
    authorDisplayName: string
}

type UserAction =  
    {type: "UPDATE", payload: {username: string, sessionToken: string}} |
    {type: "REFRESH", payload: {sessionToken: string}} |
    {type: "SIGNOUT"};

type UserContextType = {
    state: UserInfo;
    dispatch: React.Dispatch<UserAction>;
}

export const UserContext = createContext<UserContextType>(
    {state: {username: "", sessionToken: ""}, dispatch: () => {}}        
);


function App() {
    const [userInfo, userInfoDispatch] = useReducer(
        (state: UserInfo, action: UserAction) => {
            switch(action.type) {
                case "UPDATE":
                    return {
                        username: action.payload.username,
                        sessionToken: action.payload.sessionToken
                    }
                case "REFRESH":
                    return {
                        username: state.username,
                        sessionToken: action.payload.sessionToken
                    }
                case "SIGNOUT":
                    localStorage.removeItem("username");
                    localStorage.removeItem("sessionToken");
                    return {
                        username: "",
                        sessionToken: ""
                    };

                default:
                    return state;
            }
        } , {username: localStorage.getItem("username") ?? "", sessionToken: localStorage.getItem("sessionToken") ?? ""});


    return (
        <UserContext.Provider value={ {state: userInfo, dispatch: userInfoDispatch} }>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={ <Home /> }/>
                    <Route path="/board" element={ <Board /> }/>
                    <Route path="/board/:id" element={ <Board /> }/>
                    <Route path="/signin" element={  <Signin /> }/>
                    <Route path="/register" element={  <Register /> }/>
                </Routes>

            </BrowserRouter>
        </UserContext.Provider>
        
    );
}

export default App;
