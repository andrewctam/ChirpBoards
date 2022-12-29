import { useContext } from "react"
import { UserContext } from "./App"

const NavBar = () => {
    const userInfo = useContext(UserContext);

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

    }

    return <div className = 'w-full bg-stone-800 shadow-lg p-4 text-white flex justify-between items-center'>
                <h1 className = "font-semibold text-2xl">
                    <a href = "/">Chirp Boards</a>
                </h1>


                <div className = "text-md">
                    { userInfo.state.username ? 
                        <p className = "text-sky-300 cursor-pointer" onClick = {signOut}>
                            Sign Out
                        </p>
                        :
                        <>
                            <a className = "text-gray-100" href = "/signin">Sign In</a>
                            <a className = "ml-6 text-sky-300" href = "/register">Register</a>
                        </>

                    }
                </div>
            </div>

}
export default NavBar