import { useEffect, useContext, useState } from "react"
import { UserContext } from "./App"

const NavBar = () => {
    const userInfo = useContext(UserContext);

    const [showDropdown, setShowDropdown] = useState(false);
    
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

    return <div className = 'w-full sticky top-0 z-50 bg-stone-800 shadow-lg p-4 text-white flex justify-between items-center'>
                <h1 className = "font-semibold text-2xl">
                    <a href = "/">Chirp Boards</a>
                </h1>

                <div className = "text-md">
                    { userInfo.state.username ? 
                        <div>
                            <p onClick = {() => setShowDropdown(!showDropdown)} className = "cursor-pointer select-none">
                            {`@${userInfo.state.username} ▼ `}
                            </p>

                            {showDropdown ?
                                <div className = "relative">
                                    <div className = "absolute lg:-rotate-[8deg] -right-1 top-2 px-8 py-2 w-fit z-20 bg-sky-200 lg:bg-sky-200/80 border border-black lg:border-black/10 rounded-b-xl rounded-tl-xl text-center">
                                        <p><a href={`/profile/${[userInfo.state.username]}`} className = "text-black mt-2 cursor-pointer text-center">
                                            Profile
                                        </a></p>

                                        <p className="my-2"><a href={`/settings`} className = "text-black cursor-pointer text-center">
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
                            <a className = "text-gray-100" href = "/signin?return=true">Sign In</a>
                            <a className = "ml-6 text-sky-300" href = "/register?return=true">Register</a>
                        </>

                    }
                </div>
            </div>

}
export default NavBar