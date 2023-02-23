import { createContext, useReducer } from "react";
import { BrowserRouter, Route, Routes} from "react-router-dom";
import Profile from "./account/Profile";
import Register from "./account/Register";
import Settings from "./account/Settings";
import Signin from "./account/Signin";
import Board from "./boards/Board";
import Home from "./home/Home";
import Inbox from "./menus/Inbox";
import Search from "./menus/Search";

type UserInfo = {
    username: string;
    sessionToken: string;
}

export interface PostInfo {
    id: string
    text: string
    postDate: string
    imageURL: string
    authorUsername: string
    authorDisplayName: string
    authorPictureURL: string
    score: number
    voteStatus: number | null
    rechirpStatus: boolean
    isEdited: boolean
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
    pictureURL: string
    followerCount: number
    followingCount: number
    pinnedPost: PostPayload
    userColor: string
    isFollowing: boolean
    followers: {hasNext: boolean, users: UserPayload[]}
    following: {hasNext: boolean, users: UserPayload[]}
    posts: {hasNext: boolean, posts: PostPayload[]}
    postCount: number
}
export interface PostPayload {
    id: string
    author: UserPayload
    text: string
    imageURL: string
    isComment: boolean
    parentPost: PostPayload | null
    rootPost: PostPayload | null
    postDate: string
    score: number
    voteStatus: number
    rechirpStatus: boolean
    commentCount: number
    comments: {hasNext: boolean, posts: PostPayload[]}
    isEdited: boolean
    isRechirp: boolean
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
                    <Route path="/search" element={  <Search /> }/>
                    <Route path="/inbox" element={  <Inbox /> }/>
                </Routes>

            </BrowserRouter>
        </UserContext.Provider>
    );
}

export default App;
