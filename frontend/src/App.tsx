import { createContext, useReducer, useState } from "react";
import { BrowserRouter, Route, Routes} from "react-router-dom";
import Profile from "./account/Profile";
import Register from "./account/Register";
import Settings from "./account/Settings";
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
    score: number
    voteStatus: number | null
}

type UserAction =  
    {type: "UPDATE", payload: {username: string, sessionToken: string}} |
    {type: "REFRESH", payload: {sessionToken: string}} |
    {type: "SIGNOUT"};

type UserContextType = {
    state: UserInfo;
    dispatch: React.Dispatch<UserAction>;
}

export interface UserPayload {
    username: string
    displayName: string
    followerCount: number
    followingCount: number
    pinnedPost: PostPayload
    headerColor: string
    isFollowing: boolean
    followers: UserPayload[]
    following: UserPayload[]
    posts: PostPayload[]
    postCount: number
}
export interface PostPayload {
    id: string
    author: UserPayload
    text: string
    isComment: boolean
    parentPost: PostPayload | null
    rootPost: PostPayload | null
    postDate: string
    score: number
    voteStatus: number
    commentCount: number
    comments: PostPayload[]
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
                        username: action.payload.username.toLowerCase(),
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
                    <Route path="/board/:id" element={ <Board /> }/>
                    <Route path="/signin" element={  <Signin /> }/>
                    <Route path="/register" element={  <Register /> }/>
                    <Route path="/profile/:username" element={  <Profile /> }/>
                    <Route path="/settings" element={  <Settings /> }/>
                </Routes>

            </BrowserRouter>
        </UserContext.Provider>
    );
}

export default App;
