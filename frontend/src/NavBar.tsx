import { useEffect, useContext } from "react"
import { UserContext } from "./App"

const NavBar = () => {
    const userInfo = useContext(UserContext);

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
            signout(username: "${userInfo.state.username}", sessionToken: "${userInfo.state.sessionToken}")
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

    return <div className = 'w-full bg-stone-800 shadow-lg p-4 text-white flex justify-between items-center'>
                <h1 className = "font-semibold text-2xl">
                    <a href = "/">Chirp Boards</a>
                </h1>


                <div className = "text-md">
                    { userInfo.state.username ? 
                        <div>
                            <a href={`/profile/${[userInfo.state.username]}`}>
                            {`Logged in as @${userInfo.state.username}`}
                            </a>
                            <p className = "text-rose-100 mt-2 cursor-pointer" onClick = {signOut}>
                                Sign Out
                            </p>
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