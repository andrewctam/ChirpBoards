import React, { useEffect, useContext, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "./App"

const NavBar = () => {
    const userInfo = useContext(UserContext);

    const [showDropdown, setShowDropdown] = useState(false);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();

    const [userColor, setUserColor] = useState("#000000");

    const navigate = useNavigate();
    
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        }

        window.addEventListener("resize", handleResize);

        if (searchParams.get("query") && window.location.pathname === "/search") {
            setSearchInput(searchParams.get("query") ?? "");
        }

        return () => {
            window.removeEventListener("resize", handleResize);
        }
    }, [])

    const verifySession = async () => {       
        if (!userInfo.state.username) {
            return;
        }
        
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            verifySession(username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}")
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({query})
        }).then(res => res.json())

        console.log(response);
        if (!response.data.verifySession) {
            userInfo.dispatch({type: "SIGNOUT"});
        } else {
            setUserColor(response.data.verifySession.userColor);
        }
    }

    const search = async (e: React.FormEvent<HTMLFormElement | HTMLInputElement> | React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        if (searchInput !== "") {
            navigate(`/search?query=${searchInput}&feed=${searchParams.get("feed") ?? "chirps"}`)
            window.location.reload();
        }
    }

    useEffect(() => {
        //verify the session anytime a page is loaded
        verifySession();
    }, [])

    const signOut = async () => {
        userInfo.dispatch({type: "SIGNOUT"});
       
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const query = 
        `mutation {
            signout(username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}") {
                msg
            }
        }`

        await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({query})
        })

        window.location.reload();

    }

    return (<>
        <div className = 'w-full sticky top-0 z-50 bg-stone-800 shadow-lg p-4 text-sky-200 flex justify-between items-center'>
            <h1 className = "font-semibold text-2xl inline">
                <a href = "/">Chirp Boards</a>
            </h1>

            <div>
                <form onSubmit = {search} className = "hidden sm:inline-block  mr-4">
                    <input
                        value = {searchInput}
                        onChange = {(e) => setSearchInput(e.target.value)}
                        className = "p-2 mx-auto rounded-xl bg-white/20 text-white border border-black w-80" 
                        placeholder="Search for a user or chirp" />
                </form>

                {windowWidth < 640 ?
                <p className = "text-white cursor-pointer text-center inline mr-6" 
                    onClick={() =>  {
                        setSearchInput("");
                        setShowMobileSearch(!showMobileSearch);
                    }}>

                    {showMobileSearch ? "Close" : "Search"}
                </p> : null}


                { userInfo.state.username ? 
                    <div className = "inline-block">
                        <div onClick = {() => setShowDropdown(!showDropdown)} className = "cursor-pointer select-none inline-block">
                            {`@${userInfo.state.username} ▼`}
                        </div>
                        

                        {showDropdown ?
                            <div className = "relative">
                                <div className = "absolute -right-1 top-4 px-8 py-2 w-fit z-20 bg-sky-200 lg:bg-sky-200/80 border border-black lg:border-black/10 rounded-b-xl rounded-tl-xl text-center">
                                    <p className = "text-black cursor-pointer text-center"><a href={`/profile/${[userInfo.state.username]}`}>
                                        Profile
                                    </a></p>

                                    <p className="my-2 text-black cursor-pointer text-center"><a href={`/settings`}>
                                        Settings
                                    </a></p>
                                    
                                    <p className = "text-black cursor-pointer w-fit whitespace-nowrap text-center" onClick = {signOut}>
                                        Sign Out
                                    </p>
                                </div> 
                            </div>
                        : null}
                    </div>
                    :
                    <>
                        <a className = "text-sky-100" href = "/signin">Sign In</a>
                        <a className = "ml-6 text-sky-300" href = "/register">Register</a>
                    </>

                }
            </div>
        </div>

        {showMobileSearch && windowWidth < 640 ?
            <form onSubmit = {search} className = 'w-full bg-stone-800 shadow-lg p-4 text-white flex justify-between items-center'>
                <input 
                    value = {searchInput}
                    onChange = {(e) => setSearchInput(e.target.value)}
                    className = "p-2 w-full mx-auto rounded-xl bg-white/20 text-white border border-black mr-4" 
                    placeholder="Search for a user or chirp" /> 
                
                <p className = "text-gray-50 mt-2 cursor-pointer text-center mr-4 my-auto" onClick={search}>
                    Search
                </p>
            </form>
        : null}
    </>)
}
export default NavBar